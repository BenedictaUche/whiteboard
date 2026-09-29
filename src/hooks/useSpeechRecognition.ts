import { useState, useEffect, useRef, useCallback } from 'react';
import { trackEvent } from '../lib/analytics';

export type SpeechStatus = 'unsupported' | 'idle' | 'listening' | 'denied' | 'error' | 'stopped';

function appendFinalTranscript(existing: string, incoming: string): string {
    const next = incoming.trim();
    if (!next)
        return existing;
    const base = existing.trim();
    if (!base)
        return next;
    if (base === next || base.endsWith(next))
        return base;
    if (next.startsWith(base))
        return next;
    const lastSentence = base.split(/(?<=[.!?])\s+/).pop() ?? '';
    if (lastSentence && next.startsWith(lastSentence)) {
        return `${base.slice(0, base.length - lastSentence.length)}${next}`.trim();
    }
    return `${base} ${next}`.trim();
}

export function useSpeechRecognition(args: {
    enabled: boolean;
    onFinalTranscript: (merged: string) => void;
    track?: string;
    mode?: string;
    difficulty?: string;
}) {
    const { enabled, onFinalTranscript } = args;
    const [speechStatus, setSpeechStatus] = useState<SpeechStatus>('idle');
    const [interimText, setInterimText] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const shouldListenRef = useRef(enabled);
    const finalTranscriptRef = useRef('');
    const manualEditRef = useRef(false);

    const syncTranscript = useCallback((nextFinal: string) => {
        finalTranscriptRef.current = nextFinal;
        onFinalTranscript(nextFinal);
    }, [onFinalTranscript]);

    // Manual edits suppress recognition merging briefly so the recognizer
    // doesn't overwrite what the user just typed.
    const handleManualEdit = useCallback((value: string) => {
        manualEditRef.current = true;
        finalTranscriptRef.current = value;
        onFinalTranscript(value);
        window.setTimeout(() => {
            manualEditRef.current = false;
        }, 1500);
    }, [onFinalTranscript]);

    const stopListening = useCallback(() => {
        shouldListenRef.current = false;
        setInterimText('');
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            }
            catch {
            }
        }
    }, []);

    useEffect(() => {
        if (!enabled)
            return;
        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) {
            setSpeechStatus('unsupported');
            return;
        }
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        recognition.onstart = () => {
            if (shouldListenRef.current) {
                setSpeechStatus('listening');
            }
        };
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const piece = result[0]?.transcript ?? '';
                if (!piece)
                    continue;
                if (result.isFinal) {
                    if (manualEditRef.current)
                        continue;
                    const merged = appendFinalTranscript(finalTranscriptRef.current, piece);
                    syncTranscript(merged);
                }
                else {
                    interim += piece;
                }
            }
            setInterimText(interim.trim());
        };
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            const error = event.error;
            if (error === 'not-allowed' || error === 'service-not-allowed') {
                shouldListenRef.current = false;
                setSpeechStatus('denied');
                return;
            }
            if (error === 'aborted' || error === 'no-speech') {
                return;
            }
            console.warn('Speech recognition error:', error);
            setSpeechStatus('error');
        };
        recognition.onend = () => {
            setInterimText('');
            if (shouldListenRef.current) {
                try {
                    recognition.start();
                }
                catch {
                }
            }
            else {
                setSpeechStatus((prev) => (prev === 'denied' ? prev : 'stopped'));
            }
        };
        recognitionRef.current = recognition;
        shouldListenRef.current = true;
        try {
            recognition.start();
            setSpeechStatus('listening');
            trackEvent('recording_started', {
                track: args.track,
                mode: args.mode,
                difficulty: args.difficulty,
            });
        }
        catch (e) {
            console.warn('Speech recognition init error:', e);
            setSpeechStatus('error');
        }
        return () => {
            shouldListenRef.current = false;
            try {
                recognition.onresult = null;
                recognition.onend = null;
                recognition.onerror = null;
                recognition.stop();
            }
            catch {
            }
            recognitionRef.current = null;
        };
    }, [enabled, syncTranscript, args.track, args.mode, args.difficulty]);

    return {
        speechStatus,
        interimText,
        handleManualEdit,
        stopListening,
    };
}
