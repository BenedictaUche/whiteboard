import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppStep, Track, Mode, Topic, AIFeedback, DrillRecord, Theme } from './types';
import { getTopicsForTrack } from './data/questions';
import { trackEvent } from './lib/analytics';
import { pickLocalFallback, pickFromPool } from './lib/topicPool';
import { useTopicPool } from './hooks/useTopicPool';
import { useDrillRecords } from './hooks/useDrillRecords';
import { useFeedback } from './hooks/useFeedback';
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

export default function App() {
    // ---- Local UI / interaction state (intentionally React state) ----
    const [currentStep, setCurrentStep] = useState<AppStep>('selection');
    const [selectedTrack, setSelectedTrack] = useState<Track>('Frontend');
    const [selectedMode, setSelectedMode] = useState<Mode>('Deep Research');
    const [currentTopic, setCurrentTopic] = useState<Topic>(() => getTopicsForTrack('Frontend')[0]);
    const [notes, setNotes] = useState('');
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState<AIFeedback | null>(null);
    const [theme, setTheme] = useState<Theme>('cream');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const recentTopicIdsRef = useRef<string[]>([]);
    const initializedTracksRef = useRef<Set<Track>>(new Set());

    const { records, addRecord, clearRecords } = useDrillRecords();
    const topicPool = useTopicPool(selectedTrack, records);
    const feedbackMutation = useFeedback();

    const rememberTopic = (id: string) => {
        const next = [id, ...recentTopicIdsRef.current.filter((x) => x !== id)];
        recentTopicIdsRef.current = next.slice(0, RECENT_TOPIC_MEMORY);
    };

    const transitionTo = useCallback((nextStep: AppStep) => {
        setCurrentStep(nextStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const { pool } = topicPool;
    useEffect(() => {
        if (!pool || pool.topics.length === 0)
            return;
        if (initializedTracksRef.current.has(selectedTrack))
            return;
        initializedTracksRef.current.add(selectedTrack);
        const initial = pickFromPool(pool, currentTopic.id, recentTopicIdsRef.current) ?? pool.topics[0];
        if (!initial)
            return;
        rememberTopic(initial.id);
        setCurrentTopic(initial);
    }, [pool, selectedTrack]);

    useEffect(() => {
        if (!topicPool.error || pool)
            return;
        const fallback = pickLocalFallback(selectedTrack);
        rememberTopic(fallback.id);
        setCurrentTopic(fallback);
    }, [topicPool.error, pool, selectedTrack]);

    // ---- Theme ----
    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark', 'sage');
        document.documentElement.classList.add(theme === 'dark' ? 'dark' : theme === 'sage' ? 'sage' : 'light');
    }, [theme]);

    // ---- Derived ----
    const practiceSummary = useMemo(() => {
        if (records.length === 0)
            return null;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const sessionsToday = records.filter((r) => r.timestamp >= startOfToday.getTime()).length;
        const last = records[0];
        return {
            totalSessions: records.length,
            sessionsToday,
            lastTopicTitle: last.topic.title,
            lastTrack: last.track,
            lastPracticedAt: last.timestamp,
        };
    }, [records]);

    const lastAttemptFocusAreas = useMemo(() => {
        if (!feedback)
            return null;
        const rank = { high: 0, medium: 1, low: 2 } as const;
        const concepts = [...feedback.missingConcepts]
            .sort((a, b) => rank[a.importance] - rank[b.importance])
            .slice(0, 3)
            .map((m) => m.concept);
        if (concepts.length === 0)
            return null;
        return { concepts, nextStep: feedback.nextPractice?.instruction || '' };
    }, [feedback]);

    // ---- Handlers ----
    const handleSpinAgain = (nextTopic: Topic) => {
        trackEvent('topic_spun', { track: selectedTrack });
        rememberTopic(nextTopic.id);
        setCurrentTopic(nextTopic);
        topicPool.consume(nextTopic.id, topicPool.topics);
    };

    const handleGetStarted = () => {
        trackEvent(selectedMode === 'Quick Pitch' ? 'quick_pitch_started' : 'deep_research_started', {
            track: selectedTrack,
            difficulty: currentTopic.diff,
        });
        setNotes('');
        setTranscript('');
        setFeedback(null);
        feedbackMutation.reset();
        transitionTo(selectedMode === 'Quick Pitch' ? 'presentation' : 'research');
    };

    const handleStartNextChallenge = () => {
        trackEvent('next_challenge_clicked', { track: selectedTrack, mode: selectedMode });
        const next = topicPool.pickNext(currentTopic.id, recentTopicIdsRef.current);
        if (!next)
            return;
        rememberTopic(next.id);
        setCurrentTopic(next);
        topicPool.consume(next.id, topicPool.topics);
        setNotes('');
        setTranscript('');
        setFeedback(null);
        feedbackMutation.reset();
        transitionTo(selectedMode === 'Quick Pitch' ? 'presentation' : 'research');
    };

    const handleGetFeedback = async () => {
        if (!transcript.trim())
            return;
        trackEvent('feedback_requested', {
            track: selectedTrack,
            mode: selectedMode,
            difficulty: currentTopic.diff,
        });
        try {
            const data = await feedbackMutation.mutateAsync({
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
            addRecord(newRecord);
            trackEvent('feedback_completed', {
                track: selectedTrack,
                mode: selectedMode,
                difficulty: currentTopic.diff,
            });
            trackEvent('session_completed', { track: selectedTrack, mode: selectedMode });
            transitionTo('feedback');
        }
        catch (err) {
            console.error('Error getting feedback:', err);
            trackEvent('feedback_failed', { track: selectedTrack, mode: selectedMode });
        }
    };

    const handlePracticeAgain = () => {
        trackEvent('practice_again_clicked', { track: selectedTrack, mode: selectedMode });
        setTranscript('');
        feedbackMutation.reset();
        transitionTo('presentation');
    };

    const handlePracticeFollowUp = (question: string) => {
        const trimmed = question.trim();
        if (!trimmed)
            return;
        const followUpTopic: Topic = {
            id: `followup-${Date.now()}`,
            title: trimmed,
            diff: currentTopic.diff,
            res: 'No research needed',
            pres: currentTopic.pres || '3 min presentation',
            category: selectedTrack,
            hint: `Follow-up from your previous answer on "${currentTopic.title}".`,
            researchTime: 0,
            presentationTime: currentTopic.presentationTime ?? 3,
        };
        setNotes('');
        setTranscript('');
        setFeedback(null);
        feedbackMutation.reset();
        setCurrentTopic(followUpTopic);
        rememberTopic(followUpTopic.id);
        transitionTo('presentation');
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
        setTheme((prev) => (prev === 'cream' ? 'sage' : prev === 'sage' ? 'dark' : 'cream'));
    };

    const handleCustomTopicSelected = (topic: Topic) => {
        setCurrentTopic(topic);
        rememberTopic(topic.id);
    };

    return (<div className={`min-h-screen flex flex-col relative z-0 selection:bg-[#E8F3E8] selection:text-[#1A1A24] transition-colors duration-300 ${theme === 'dark'
            ? 'bg-[#18181f] text-gray-100'
            : theme === 'sage'
                ? 'bg-[#f4f7f4] text-[#1b1c15]'
                : 'bg-[#FDFCF5] text-[#1b1c15]'}`}>
      <BackgroundDecorations />

      <Header currentStep={currentStep} onNavigate={transitionTo} theme={theme} onToggleTheme={handleToggleTheme} onOpenHelp={() => setIsHelpOpen(true)} onOpenSettings={() => setIsSettingsOpen(true)}/>

      <main className="grow w-full max-w-250 mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-12 pb-12 sm:pb-16 flex flex-col relative z-10">
        {currentStep === 'selection' && (<TopicSelectionState selectedTrack={selectedTrack} setSelectedTrack={setSelectedTrack} selectedMode={selectedMode} setSelectedMode={setSelectedMode} currentTopic={currentTopic} history={records} recentTopicIds={recentTopicIdsRef.current} onSpinAgain={handleSpinAgain} onGetStarted={handleGetStarted} practiceSummary={practiceSummary} onStartNextChallenge={handleStartNextChallenge} onPoolTopicPicked={handleCustomTopicSelected} onCustomTopicSelected={handleCustomTopicSelected}/>)}

        {currentStep === 'research' && (<ResearchState topic={currentTopic} notes={notes} setNotes={setNotes} onBeginPresentation={() => transitionTo('presentation')}/>)}

        {currentStep === 'presentation' && (<PresentationState topic={currentTopic} mode={selectedMode} focusAreas={lastAttemptFocusAreas} notes={notes} transcript={transcript} setTranscript={setTranscript} onFinishPresentation={() => transitionTo('results')}/>)}

        {currentStep === 'results' && (<ResultsState topic={currentTopic} transcript={transcript} setTranscript={setTranscript} onGetFeedback={handleGetFeedback} isLoadingFeedback={feedbackMutation.isPending} feedbackError={feedbackMutation.error}/>)}

        {currentStep === 'feedback' && feedback && (<FeedbackState topic={currentTopic} feedback={feedback} onStartNewDrill={() => transitionTo('selection')} onPracticeAgain={handlePracticeAgain} onPracticeFollowUp={handlePracticeFollowUp}/>)}

        {currentStep === 'history' && (<HistoryView records={records} onSelectRecord={handleSelectRecordFromHistory} onClearHistory={clearRecords} onStartNewDrill={() => transitionTo('selection')}/>)}
      </main>

      <Footer onOpenPrivacy={() => setIsHelpOpen(true)} onOpenTerms={() => setIsHelpOpen(true)} onOpenSupport={() => setIsHelpOpen(true)}/>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} setTheme={setTheme}/>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)}/>
    </div>);
}
