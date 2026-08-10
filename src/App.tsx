import React, { useState, useEffect, useRef } from 'react';
import {
  AppStep,
  Track,
  Mode,
  Topic,
  AIFeedback,
  DrillRecord,
  Theme,
} from './types';
import { getTopicsForTrack, getAllTopics } from './data/questions';
import {
  requestFeedback,
  requestCustomTopic,
  AIUnavailableError,
} from './lib/api';
import {
  ensureTopicPool,
  invalidateTopicPool,
  pickFromPool,
  pickLocalFallback,
} from './lib/topicPool';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BackgroundDecorations } from './components/BackgroundDecorations';
import { TopicSelectionState } from './components/TopicSelectionState';
import { ResearchState } from './components/ResearchState';
import { PresentationState } from './components/PresentationState';
import { ResultsState } from './components/ResultsState';
import { FeedbackState } from './components/FeedbackState';
import { HistoryView } from './components/HistoryView';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';

const RECENT_TOPIC_MEMORY = 8;

function isLegacyFeedback(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return 'summaryQuote' in v || 'accuracyScore' in v || 'suggestedTopics' in v;
}

function loadDrillRecords(): DrillRecord[] {
  try {
    const saved = localStorage.getItem('Whiteboard_records');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    // Drop legacy records with the old fake / Gemini feedback shape
    return parsed.filter(
      (r) => r && r.feedback && !isLegacyFeedback(r.feedback)
    ) as DrillRecord[];
  } catch {
    return [];
  }
}

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('selection');
  const [selectedTrack, setSelectedTrack] = useState<Track>('Frontend');
  const [selectedMode, setSelectedMode] = useState<Mode>('Deep Research');

  const allTopics = getAllTopics();
  const [topicsBank, setTopicsBank] = useState<Topic[]>(allTopics);
  const [currentTopic, setCurrentTopic] = useState<Topic>(
    () => getTopicsForTrack('Frontend')[0] ?? allTopics[0]
  );
  const recentTopicIdsRef = useRef<string[]>([]);

  const rememberTopic = (id: string) => {
    const next = [id, ...recentTopicIdsRef.current.filter((x) => x !== id)];
    recentTopicIdsRef.current = next.slice(0, RECENT_TOPIC_MEMORY);
  };

  const [notes, setNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [customTopicError, setCustomTopicError] = useState<string | null>(null);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState<string | null>(null);

  const [theme, setTheme] = useState<Theme>('cream');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [drillRecords, setDrillRecords] = useState<DrillRecord[]>(loadDrillRecords);

  useEffect(() => {
    try {
      localStorage.setItem('Whiteboard_records', JSON.stringify(drillRecords));
    } catch {
      /* ignore quota errors */
    }
  }, [drillRecords]);

  // Whenever the track changes, fetch/refresh the topic pool and seed `currentTopic`.
  useEffect(() => {
    let cancelled = false;
    setPoolLoading(true);
    setPoolError(null);
    ensureTopicPool(selectedTrack)
      .then((pool) => {
        if (cancelled) return;
        if (pool.topics.length === 0) {
          setPoolError('No topics available for this track right now.');
          return;
        }
        // Pick an initial topic from the pool, prefer one we haven't used recently.
        const initial = pickFromPool(pool, currentTopic.id, recentTopicIdsRef.current)
          ?? pool.topics[0];
        if (!initial) return;
        rememberTopic(initial.id);
        setCurrentTopic(initial);
        // Augment the in-memory topics bank so other components see AI topics too.
        setTopicsBank((prev) => {
          const existing = new Set(prev.map((t) => t.id));
          const merged = [...prev];
          for (const t of pool.topics) {
            if (!existing.has(t.id)) merged.push(t);
          }
          return merged;
        });
      })
      .catch((e) => {
        if (cancelled) return;
        const message =
          e instanceof AIUnavailableError
            ? e.message
            : 'AI topic generation is unavailable right now.';
        setPoolError(message);
        // Still seed the current topic from local fallback so the UI never goes blank.
        const fallback = pickLocalFallback(selectedTrack);
        rememberTopic(fallback.id);
        setCurrentTopic(fallback);
      })
      .finally(() => {
        if (!cancelled) setPoolLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrack]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'sage');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'sage') {
      document.documentElement.classList.add('sage');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const handleSpinAgain = (nextTopic: Topic) => {
    rememberTopic(nextTopic.id);
    setCurrentTopic(nextTopic);
  };

  const handleRefreshPool = async () => {
    invalidateTopicPool(selectedTrack);
    setPoolLoading(true);
    setPoolError(null);
    try {
      const pool = await ensureTopicPool(selectedTrack);
      if (pool.topics.length > 0) {
        const next = pickFromPool(pool, currentTopic.id, recentTopicIdsRef.current)
          ?? pool.topics[0];
        if (next) {
          rememberTopic(next.id);
          setCurrentTopic(next);
        }
      }
    } catch (e) {
      const message =
        e instanceof AIUnavailableError
          ? e.message
          : 'Could not refresh topic pool.';
      setPoolError(message);
    } finally {
      setPoolLoading(false);
    }
  };

  const handleGenerateCustomTopic = async () => {
    setIsGeneratingCustom(true);
    setCustomTopicError(null);
    try {
      const data = await requestCustomTopic({
        track: selectedTrack,
        difficulty: 'Intermediate',
      });
      const newTopic: Topic = {
        id: `custom-${Date.now()}`,
        title: data.title,
        diff: data.diff,
        res: `${data.researchTime} min research`,
        pres: `${data.presentationTime} min presentation`,
        category: selectedTrack,
        hint: 'AI generated custom interview prompt.',
        researchTime: data.researchTime,
        presentationTime: data.presentationTime,
      };
      setTopicsBank((prev) => [newTopic, ...prev]);
      setCurrentTopic(newTopic);
      rememberTopic(newTopic.id);
    } catch (e) {
      const message =
        e instanceof AIUnavailableError
          ? e.message
          : 'AI feedback is currently unavailable.';
      setCustomTopicError(message);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const transitionTo = (nextStep: AppStep) => {
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Get Started — Quick Pitch skips research; Deep Research starts the timer. */
  const handleGetStarted = () => {
    setNotes('');
    setTranscript('');
    setFeedback(null);
    setFeedbackError(null);

    if (selectedMode === 'Quick Pitch') {
      transitionTo('presentation');
    } else {
      transitionTo('research');
    }
  };

  const handleBeginPresentation = () => {
    transitionTo('presentation');
  };

  const handleFinishPresentation = () => {
    transitionTo('results');
  };

  const handleGetFeedback = async () => {
    if (!transcript.trim()) {
      setFeedbackError('Add a transcript before requesting AI feedback.');
      return;
    }

    setIsLoadingFeedback(true);
    setFeedbackError(null);
    try {
      const data = await requestFeedback({
        topic: currentTopic,
        track: selectedTrack,
        mode: selectedMode,
        transcript: transcript.trim(),
        notes,
      });

      setFeedback(data);

      const newRecord: DrillRecord = {
        id: `drill-${Date.now()}`,
        timestamp: Date.now(),
        topic: currentTopic,
        track: selectedTrack,
        mode: selectedMode,
        researchNotes: notes,
        transcript,
        feedback: data,
      };

      setDrillRecords((prev) => [newRecord, ...prev]);
      transitionTo('feedback');
    } catch (err) {
      console.error('Error getting feedback:', err);
      const message =
        err instanceof AIUnavailableError
          ? err.message
          : 'AI feedback is currently unavailable.';
      setFeedbackError(message);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleSelectSuggestedTopic = (topicTitle: string) => {
    const custom: Topic = {
      id: `suggested-${Date.now()}`,
      title: topicTitle.startsWith('Explain') ? topicTitle : `Explain ${topicTitle}`,
      diff: 'Intermediate',
      res: '10 min research',
      pres: '3 min presentation',
      category: selectedTrack,
      hint: `Deep dive topic suggested by your AI mentor: ${topicTitle}`,
      researchTime: 10,
      presentationTime: 3,
    };
    setTopicsBank((prev) => [custom, ...prev]);
    setCurrentTopic(custom);
    rememberTopic(custom.id);
    transitionTo('selection');
  };

  const handleSelectRecordFromHistory = (record: DrillRecord) => {
    setCurrentTopic(record.topic);
    setSelectedTrack(record.track);
    setSelectedMode(record.mode);
    setNotes(record.researchNotes || '');
    setTranscript(record.transcript || '');
    setFeedback(record.feedback);
    transitionTo('feedback');
  };

  const handleToggleTheme = () => {
    if (theme === 'cream') setTheme('sage');
    else if (theme === 'sage') setTheme('dark');
    else setTheme('cream');
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative z-0 selection:bg-[#E8F3E8] selection:text-[#1A1A24] transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-[#18181f] text-gray-100'
          : theme === 'sage'
            ? 'bg-[#f4f7f4] text-[#1b1c15]'
            : 'bg-[#FDFCF5] text-[#1b1c15]'
      }`}
    >
      <BackgroundDecorations />

      <Header
        currentStep={currentStep}
        onNavigate={(step) => transitionTo(step)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="grow w-full max-w-250 mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-12 pb-12 sm:pb-16 flex flex-col relative z-10">
        {currentStep === 'selection' && (
          <TopicSelectionState
            selectedTrack={selectedTrack}
            setSelectedTrack={setSelectedTrack}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            currentTopic={currentTopic}
            poolTopics={topicsBank.filter(
              (t) => t.category === selectedTrack || t.id.startsWith('ai-')
            )}
            recentTopicIds={recentTopicIdsRef.current}
            onSpinAgain={handleSpinAgain}
            onGetStarted={handleGetStarted}
            onGenerateCustomTopic={handleGenerateCustomTopic}
            isGeneratingCustom={isGeneratingCustom}
            customTopicError={customTopicError}
            poolLoading={poolLoading}
            poolError={poolError}
            onRefreshPool={handleRefreshPool}
          />
        )}

        {currentStep === 'research' && (
          <ResearchState
            topic={currentTopic}
            notes={notes}
            setNotes={setNotes}
            onBeginPresentation={handleBeginPresentation}
          />
        )}

        {currentStep === 'presentation' && (
          <PresentationState
            topic={currentTopic}
            notes={notes}
            transcript={transcript}
            setTranscript={setTranscript}
            onFinishPresentation={handleFinishPresentation}
          />
        )}

        {currentStep === 'results' && (
          <ResultsState
            topic={currentTopic}
            transcript={transcript}
            setTranscript={setTranscript}
            onGetFeedback={handleGetFeedback}
            isLoadingFeedback={isLoadingFeedback}
            feedbackError={feedbackError}
          />
        )}

        {currentStep === 'feedback' && feedback && (
          <FeedbackState
            topic={currentTopic}
            feedback={feedback}
            onStartNewDrill={() => transitionTo('selection')}
            onSelectSuggestedTopic={handleSelectSuggestedTopic}
          />
        )}

        {currentStep === 'history' && (
          <HistoryView
            records={drillRecords}
            onSelectRecord={handleSelectRecordFromHistory}
            onClearHistory={() => setDrillRecords([])}
            onStartNewDrill={() => transitionTo('selection')}
          />
        )}
      </main>

      <Footer
        onOpenPrivacy={() => setIsHelpOpen(true)}
        onOpenTerms={() => setIsHelpOpen(true)}
        onOpenSupport={() => setIsHelpOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}