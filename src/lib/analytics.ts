import posthog from 'posthog-js';
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN ?? '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com';
export type AnalyticsEvent = 'page_view' | 'track_selected' | 'topic_generation_started' | 'topic_generation_completed' | 'topic_generation_failed' | 'topic_spun' | 'quick_pitch_started' | 'deep_research_started' | 'recording_started' | 'recording_completed' | 'feedback_requested' | 'feedback_completed' | 'feedback_failed' | 'practice_again_clicked' | 'next_challenge_clicked' | 'custom_topic_generated' | 'session_completed';
export interface AnalyticsProps {
    track?: string;
    mode?: string;
    difficulty?: string;
}
let initialized = false;
export function initAnalytics(): void {
    if (initialized || !POSTHOG_KEY || typeof window === 'undefined')
        return;
    try {
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            autocapture: false,
            capture_pageview: false,
            disable_session_recording: true,
            persistence: 'memory',
            disable_persistence: true,
            advanced_disable_toolbar_metrics: true,
        });
        initialized = true;
    }
    catch (e) {
        console.warn('Analytics init skipped:', e);
    }
}
export function trackEvent(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
    if (!initialized)
        return;
    try {
        const safeProps: AnalyticsProps = {};
        if (props.track !== undefined)
            safeProps.track = props.track;
        if (props.mode !== undefined)
            safeProps.mode = props.mode;
        if (props.difficulty !== undefined)
            safeProps.difficulty = props.difficulty;
        posthog.capture(event, safeProps);
    }
    catch {
    }
}
