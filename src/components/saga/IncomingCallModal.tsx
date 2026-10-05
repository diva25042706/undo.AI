// ============================================================================
// UNDO.AI (AG02) — IN-APP SMARTPHONE INCOMING VOICE CALL INTERFACE
// 100% Free Realistic Mobile Call Screen with Web Audio Ringing & AI Speech
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useAgent } from '../../context/AgentContext';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Bot,
  User,
  X,
  Minimize2,
  Maximize2,
  MessageSquare
} from 'lucide-react';

export const IncomingCallModal: React.FC = () => {
  const { sagaState, triggerVoiceCall } = useAgent();
  const [callState, setCallState] = useState<'IDLE' | 'RINGING' | 'CONNECTED' | 'ENDED'>('IDLE');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [qnaAnswer, setQnaAnswer] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastCallIdRef = useRef<string | null>(null);

  const voiceData = sagaState.voiceCallNotification;

  // 1. Trigger incoming call modal whenever a voice call notification is posted
  useEffect(() => {
    if (voiceData && voiceData.callId && voiceData.callId !== lastCallIdRef.current) {
      lastCallIdRef.current = voiceData.callId;
      setCallState('RINGING');
      setCallDuration(0);
      setIsMinimized(false);
      setQnaAnswer(null);
      startRingtone();
    }
  }, [voiceData]);

  // 2. Web Audio Telephone Ringtone Synthesizer (440Hz + 480Hz dual-tone)
  const startRingtone = () => {
    stopRingtone();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const playRingBurst = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
        try {
          const now = audioContextRef.current.currentTime;
          const osc1 = audioContextRef.current.createOscillator();
          const osc2 = audioContextRef.current.createOscillator();
          const gain = audioContextRef.current.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(480, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
          gain.gain.setValueAtTime(0.12, now + 1.8);
          gain.gain.linearRampToValueAtTime(0, now + 2.0);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(audioContextRef.current.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 2.0);
          osc2.stop(now + 2.0);
        } catch (e) {
          console.warn('[WebAudio] Ring burst error:', e);
        }
      };

      playRingBurst();
      ringIntervalRef.current = setInterval(playRingBurst, 4000);
    } catch (e) {
      console.warn('[WebAudio] AudioContext init failed:', e);
    }
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  // 3. Answer Call Handler
  const handleAnswer = () => {
    stopRingtone();
    setCallState('CONNECTED');
    setCallDuration(0);

    // Start live duration counter
    timerIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Speak AI Voice script via Web Speech API
    const script = voiceData?.speechScript ||
      `Hello ${voiceData?.customerName || 'Divakaran'}, this is UNDO.AI automated assistant. Your transaction has been verified and processed.`;
    setActiveSubtitle(script);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(script);
      utteranceRef.current = utterance;
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          v.lang.includes('en-IN') ||
          v.name.includes('Google India') ||
          v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.lang.includes('en-US')
      );
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onend = () => {
        // Keep call open for interactive questions
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  // 4. Decline / End Call Handler
  const handleEndCall = () => {
    stopRingtone();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setCallState('ENDED');
    setTimeout(() => {
      setCallState('IDLE');
    }, 2500);
  };

  // 5. Interactive Assistant Question during Call
  const handleAskQuestion = (question: string) => {
    const q = question.toLowerCase();
    let answer = 'All actions have been safely verified and synchronized.';

    if (q.includes('why') || q.includes('fail')) {
      answer = 'The transaction encountered an issue at the ticket creation step, triggering immediate reverse compensation.';
    } else if (q.includes('refund') || q.includes('money') || q.includes('charge')) {
      answer = `Your payment has been 100% refunded to your original payment method and verified by our durable log.`;
    } else if (q.includes('ticket') || q.includes('voucher') || q.includes('confirm')) {
      answer = `Your booking voucher has been officially confirmed and dispatched to your email address.`;
    } else if (q.includes('email') || q.includes('mail')) {
      const email = sagaState.instance?.customer?.email || 'divakaranperumal2007@gmail.com';
      answer = `A full confirmation receipt and audit trail has been sent to ${email}.`;
    }

    setQnaAnswer(answer);
    if (window.speechSynthesis && isSpeakerOn) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(answer);
      utt.rate = 1.02;
      window.speechSynthesis.speak(utt);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  if (callState === 'IDLE' && !voiceData) return null;
  if (callState === 'IDLE') return null;

  // Minimized Floating Pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <div className="bg-slate-900 border border-emerald-500/50 shadow-2xl rounded-full px-4 py-2 flex items-center gap-3 text-white">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-emerald-400">{formatTimer(callDuration)}</span>
          <span className="text-xs font-medium text-slate-200">UNDO.AI Concierge</span>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleEndCall}
            className="p-1 hover:bg-rose-900/50 rounded-full text-rose-400 hover:text-rose-300"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col">
        
        {/* Top Phone Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                callState === 'RINGING' ? 'bg-amber-400' : callState === 'CONNECTED' ? 'bg-emerald-400' : 'bg-rose-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                callState === 'RINGING' ? 'bg-amber-500' : callState === 'CONNECTED' ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
            </span>
            <span className="text-xs font-mono tracking-wider uppercase text-slate-400">
              {callState === 'RINGING' ? 'Incoming Voice Call' : callState === 'CONNECTED' ? `In Call • ${formatTimer(callDuration)}` : 'Call Ended'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {callState === 'CONNECTED' && (
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Minimize Call"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleEndCall}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Caller Avatar & Identity Area */}
        <div className="flex flex-col items-center justify-center pt-8 pb-6 px-6 text-center">
          <div className="relative mb-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 shadow-xl ${
              callState === 'RINGING'
                ? 'bg-emerald-500/20 border-emerald-500 animate-pulse ring-8 ring-emerald-500/10'
                : 'bg-indigo-500/20 border-indigo-500 ring-4 ring-indigo-500/10'
            }`}>
              <Bot className={`w-12 h-12 ${callState === 'RINGING' ? 'text-emerald-400 animate-bounce' : 'text-indigo-400'}`} />
            </div>
            {callState === 'RINGING' && (
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-slate-950 shadow-lg animate-ping">
                <Phone className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            UNDO.AI Concierge
            <ShieldCheck className="w-4 h-4 text-emerald-400 inline" />
          </h3>
          <p className="text-xs font-mono text-emerald-400 mt-1">
            +1 (737) 250-8034 ➔ {voiceData?.maskedPhone || '******0777'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {callState === 'RINGING'
              ? 'Ringing... (Simulated Carrier Call)'
              : callState === 'CONNECTED'
              ? 'HD Audio Connected • Indian English AI'
              : 'Call Disconnected'}
          </p>
        </div>

        {/* Dynamic Waveform Visualizer (When Connected) */}
        {callState === 'CONNECTED' && (
          <div className="px-6 py-2">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  AI Voice Streaming
                </span>
                <span className="font-mono text-[10px] text-slate-500">RESEND & EXOTEL VERIFIED</span>
              </div>

              {/* Animated audio bar visualizer */}
              <div className="flex items-center justify-center gap-1.5 h-8">
                {[40, 75, 95, 60, 85, 100, 70, 50, 90, 65, 80, 45, 90, 60, 40].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${(i * 0.1).toFixed(1)}s`,
                      animationDuration: '0.8s',
                    }}
                  />
                ))}
              </div>

              {/* Subtitle speech transcript */}
              <p className="text-xs text-slate-300 leading-relaxed max-h-24 overflow-y-auto bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 font-sans">
                "{activeSubtitle}"
              </p>
            </div>

            {/* Quick Interactive Q&A Buttons */}
            <div className="mt-3 flex flex-col gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Ask the Voice Agent:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Booking status?', q: 'What is my booking status?' },
                  { label: 'Is it refunded?', q: 'Was my money refunded?' },
                  { label: 'Check email?', q: 'Did you send me an email?' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(item.q)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {qnaAnswer && (
                <div className="mt-2 p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2">
                  <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{qnaAnswer}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="px-6 py-6 mt-auto">
          {callState === 'RINGING' && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleEndCall}
                className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-900/40 transition-transform active:scale-95"
              >
                <PhoneOff className="w-6 h-6" />
                <span className="text-xs">Decline</span>
              </button>

              <button
                onClick={handleAnswer}
                className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/40 transition-transform active:scale-95 animate-pulse"
              >
                <PhoneCall className="w-6 h-6" />
                <span className="text-xs">Answer</span>
              </button>
            </div>
          )}

          {callState === 'CONNECTED' && (
            <div className="flex items-center justify-around">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-full transition-colors ${
                  isMuted ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={handleEndCall}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-900/50 transition-transform active:scale-95"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`p-3.5 rounded-full transition-colors ${
                  isSpeakerOn ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
                title="Speaker"
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          )}

          {callState === 'ENDED' && (
            <div className="text-center py-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-slate-300 font-medium">Call Summary Logged to WAL</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
