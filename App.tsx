



import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation, I18nextProvider } from 'react-i18next';
import * as geminiService from './services/geminiService';
// Fix: Import AIStudio from types.ts
import { ChatMessage, ImageAspectRatio, VideoAspectRatio } from './types';
import { decode, decodeAudioData } from './utils';
import { Chat } from '@google/genai';
import i18n from './i18n';

// Fix: Moved the AIStudio interface to types.ts to resolve a TypeScript
// error about duplicate declarations. The global declaration for window.aistudio
// has also been moved to types.ts to serve as a single source of truth.
// This is the likely root cause of other phantom errors reported in this file.


// --- ICONS ---
const ServiceIcon = ({ gradient, children }: { gradient: string; children: React.ReactNode }) => (
  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${gradient} shadow-md`}>
    {children}
  </div>
);

// --- HELPER COMPONENTS ---
const LoadingSpinner = ({ className = '' }: { className?: string }) => (
    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 ${className}`}></div>
);
const ErrorMessage = ({ message }: { message: string }) => <div className="text-red-600 bg-red-100 p-3 rounded-lg mt-4 text-sm">{message}</div>;

// --- DYNAMIC FORM COMPONENTS ---
const PromptInput = React.forwardRef<HTMLTextAreaElement, { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder: string; rows?: number; required?: boolean }>(
  ({ value, onChange, placeholder, rows = 4, required = true }, ref) => (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full p-3 bg-gray-100 rounded-xl border-2 border-transparent focus:border-gray-300 focus:outline-none transition-colors"
    />
  )
);

const FileInput = ({ label, onChange, accept, required = true }: { label: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; accept: string; required?: boolean; }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type="file"
      accept={accept}
      onChange={onChange}
      required={required}
      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
    />
  </div>
);

const AspectRatioSelector = <T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: { value: T, label: string }[] }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${value === opt.value ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const SubmitButton = ({ label, loading }: { label: string; loading: boolean }) => (
  <button
    type="submit"
    disabled={loading}
    className="w-full bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-xl hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-300 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
    {loading && <LoadingSpinner className="w-5 h-5 border-gray-900" />}
    {label}
  </button>
);

// --- FEATURE PANELS ---
const TextPanel = () => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setResult('');
    try {
      const text = await geminiService.generateText(prompt);
      setResult(text);
    } catch (err) { setError(t('error')); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PromptInput value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t('promptLabel')} />
      <SubmitButton label={loading ? t('loading') : t('submitButton')} loading={loading} />
      {error && <ErrorMessage message={error} />}
      {result && <div className="mt-4 p-4 bg-gray-50 rounded-xl whitespace-pre-wrap">{result}</div>}
    </form>
  );
};

const ChatPanel = () => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { chatRef.current = geminiService.createChat([]); }, []);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

    const handleSend = async () => {
        if (!currentInput.trim() || !chatRef.current) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: currentInput }] };
        setMessages(prev => [...prev, userMessage]);
        const promptToSend = currentInput;
        setCurrentInput('');
        setLoading(true);
        setError('');

        try {
            const response = await chatRef.current.sendMessage({ message: promptToSend });
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text }] };
            setMessages(prev => [...prev, modelMessage]);
        } catch (err) { setError(t('error')); }
        finally { setLoading(false); }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-yellow-400 text-black rounded-br-none' : 'bg-gray-200 text-black rounded-bl-none'}`}>
                            {msg.parts[0].text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-black rounded-2xl rounded-bl-none p-4"><LoadingSpinner className="w-5 h-5 border-gray-500" /></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            {error && <div className="p-4"><ErrorMessage message={error}/></div>}
            <div className="p-4 bg-white border-t border-gray-200">
                <div className="relative">
                    <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                        placeholder={t('chat.placeholder')}
                        className="w-full py-3 pl-4 pr-12 bg-gray-100 rounded-full border-2 border-transparent focus:border-gray-300 focus:outline-none transition-colors"
                        disabled={loading}
                    />
                    <button onClick={handleSend} disabled={loading || !currentInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-400 rounded-full p-2 disabled:bg-gray-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

const ImageGenPanel = () => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('1:1');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError(''); setResult('');
        try {
            const imageUrl = await geminiService.generateImage(prompt, aspectRatio);
            setResult(imageUrl);
        } catch (err) { setError(t('error')); }
        finally { setLoading(false); }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PromptInput value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t('promptLabel')} />
            <AspectRatioSelector
                label={t('aspectRatio')}
                value={aspectRatio}
                onChange={(v) => setAspectRatio(v)}
                options={[ {value: '1:1', label: '1:1'}, {value: '3:4', label: '3:4'}, {value: '4:3', label: '4:3'}, {value: '16:9', label: '16:9'}, {value: '9:16', label: '9:16'} ]}
            />
            <SubmitButton label={loading ? t('loading') : t('submitButton')} loading={loading} />
            {error && <ErrorMessage message={error} />}
            {result && <img src={result} alt={t('imageGen.alt')} className="mt-4 rounded-xl w-full" />}
        </form>
    );
};

const VideoGenPanel = () => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [checkingApiKey, setCheckingApiKey] = useState(true);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setApiKeySelected(true);
            }
            setCheckingApiKey(false);
        };
        checkKey();
    }, []);
    
    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true); // Assume success
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError(''); setResult('');
        try {
            const videoUrl = await geminiService.generateVideo(prompt, imageFile, aspectRatio);
            setResult(videoUrl);
        } catch (err: any) {
            if (err?.message?.includes('Requested entity was not found.')) {
                 setError(t('apiKeyError'));
                 setApiKeySelected(false);
            } else { setError(t('error')); }
        } finally { setLoading(false); }
    };

    if (checkingApiKey) return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;

    if (!apiKeySelected) return (
        <div className="text-center space-y-4">
            <h3 className="text-lg font-bold">{t('apiKeyNeeded.title')}</h3>
            <p className="text-sm text-gray-600">{t('apiKeyNeeded.body')}</p>
            <p className="text-xs text-gray-500">{t('billingInfo')} <a href={t('billingLink')} target="_blank" rel="noopener noreferrer" className="underline">Learn more.</a></p>
            <button onClick={handleSelectKey} className="w-full bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-xl">{t('selectApiKey')}</button>
        </div>
    );
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PromptInput value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t('promptLabel')} required={!imageFile} />
            <FileInput label={t('uploadImageOptional')} onChange={(e) => setImageFile(e.target.files?.[0] || null)} accept="image/*" required={false} />
            <AspectRatioSelector
                label={t('aspectRatio')}
                value={aspectRatio}
                onChange={(v) => setAspectRatio(v)}
                options={[ {value: '16:9', label: '16:9'}, {value: '9:16', label: '9:16'} ]}
            />
            <SubmitButton label={loading ? t('loading') : t('submitButton')} loading={loading} />
            {loading && <p className="text-center text-sm text-gray-600">{t('videoGenWait')}</p>}
            {error && <ErrorMessage message={error} />}
            {result && <video src={result} controls className="mt-4 rounded-xl w-full" />}
        </form>
    );
};


const ImageEditPanel = () => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) { setError(t('error.noImage')); return; }
        setLoading(true); setError(''); setResult('');
        try {
            const imageUrl = await geminiService.editImage(imageFile, prompt);
            setResult(imageUrl);
        } catch (err) { setError(t('error')); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FileInput label={t('uploadImage')} onChange={(e) => setImageFile(e.target.files?.[0] || null)} accept="image/*" required/>
            <PromptInput value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t('prompt.editImage')} />
            <SubmitButton label={loading ? t('loading') : t('submitButton')} loading={loading} />
            {error && <ErrorMessage message={error} />}
            {result && <img src={result} alt={t('imageEdit.alt')} className="mt-4 rounded-xl w-full" />}
        </form>
    );
};

const VideoAnalysisPanel = () => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState(t('prompt.analyzeVideo_default'));
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [result, setResult] = useState('');
    const [loadingState, setLoadingState] = useState<'idle' | 'uploading' | 'analyzing'>('idle');
    const [error, setError] = useState('');

    const loading = loadingState !== 'idle';

    const handleStateChange = useCallback((state: string) => {
        if (state === 'uploading' || state === 'analyzing') {
            setLoadingState(state);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoFile) { setError(t('error.noVideo')); return; }
        setLoadingState('uploading');
        setError('');
        setResult('');
        try {
            const text = await geminiService.analyzeVideoContent(videoFile, prompt, handleStateChange);
            setResult(text);
        } catch (err) {
            setError(t('error'));
        } finally {
            setLoadingState('idle');
        }
    };

    const getButtonLabel = () => {
        if (loadingState === 'uploading') return t('uploading');
        if (loadingState === 'analyzing') return t('analyzing');
        return t('submitButton');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FileInput label={t('uploadVideo')} onChange={(e) => setVideoFile(e.target.files?.[0] || null)} accept="video/*" required/>
            <PromptInput value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t('prompt.analyzeVideo')} />
            <SubmitButton label={getButtonLabel()} loading={loading} />
            {error && <ErrorMessage message={error} />}
            {result && <div className="mt-4 p-4 bg-gray-50 rounded-xl whitespace-pre-wrap">{result}</div>}
        </form>
    );
};

const AudioAnalysisPanel = () => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState(t('prompt.analyzeAudio_default'));
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [result, setResult] = useState('');
    const [loadingState, setLoadingState] = useState<'idle' | 'uploading' | 'analyzing'>('idle');
    const [error, setError] = useState('');

    const loading = loadingState !== 'idle';

    const handleStateChange = useCallback((state: string) => {
        if (state === 'uploading' || state === 'analyzing') {
            setLoadingState(state);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!audioFile) { setError(t('error.noAudio')); return; }
        setLoadingState('uploading');
        setError('');
        setResult('');
        try {
            const text = await geminiService.analyzeAudioContent(audioFile, prompt, handleStateChange);
            setResult(text);
        } catch (err) {
            setError(t('error'));
        } finally {
            setLoadingState('idle');
        }
    };
    
    const getButtonLabel = () => {
        if (loadingState === 'uploading') return t('uploading');
        if (loadingState === 'analyzing') return t('analyzing');
        return t('submitButton');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FileInput label={t('uploadAudio')} onChange={(e) => setAudioFile(e.target.files?.[0] || null)} accept="audio/*" required/>
            <PromptInput value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t('prompt.analyzeAudio')} />
            <SubmitButton label={getButtonLabel()} loading={loading} />
            {error && <ErrorMessage message={error} />}
            {result && <div className="mt-4 p-4 bg-gray-50 rounded-xl whitespace-pre-wrap">{result}</div>}
        </form>
    );
};

const ThinkingPanel = () => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError(''); setResult('');
        try {
            const text = await geminiService.generateWithThinking(prompt);
            setResult(text);
        } catch (err) { setError(t('error')); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">{t('thinking.description')}</p>
            <PromptInput value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t('prompt.thinking')} />
            <SubmitButton label={loading ? t('loading') : t('submitButton')} loading={loading} />
            {error && <ErrorMessage message={error} />}
            {result && <div className="mt-4 p-4 bg-gray-50 rounded-xl whitespace-pre-wrap">{result}</div>}
        </form>
    );
};

const TextToSpeechPanel = () => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const [audioData, setAudioData] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => { return () => { audioContextRef.current?.close(); }; }, []);

    const playAudio = async (base64Audio: string) => {
        if (!base64Audio) return;
        try {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                 audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const decodedBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
        } catch(err) { setError(t('error.audioPlayback')); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError(''); setAudioData('');
        try {
            const data = await geminiService.textToSpeech(text);
            setAudioData(data);
            await playAudio(data);
        } catch (err) { setError(t('error')); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PromptInput value={text} onChange={(e) => setText(e.target.value)} placeholder={t('prompt.tts')} />
            <SubmitButton label={loading ? t('loading') : t('playAudio')} loading={loading} />
            {error && <ErrorMessage message={error} />}
        </form>
    );
};

// --- APP STRUCTURE ---

interface Service {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    component: React.ComponentType;
}

const servicesList: Omit<Service, 'title'|'description'>[] = [
    { id: 'videoGen', icon: <ServiceIcon gradient="from-red-400 to-yellow-400">📹</ServiceIcon>, component: VideoGenPanel },
    { id: 'imageGen', icon: <ServiceIcon gradient="from-green-400 to-blue-400">🎨</ServiceIcon>, component: ImageGenPanel },
    { id: 'chat',     icon: <ServiceIcon gradient="from-purple-400 to-pink-400">💬</ServiceIcon>, component: ChatPanel },
    { id: 'thinking', icon: <ServiceIcon gradient="from-indigo-400 to-purple-500">🧠</ServiceIcon>, component: ThinkingPanel },
    { id: 'imageEdit',icon: <ServiceIcon gradient="from-blue-400 to-teal-400">✂️</ServiceIcon>, component: ImageEditPanel },
    { id: 'videoAnalysis', icon: <ServiceIcon gradient="from-orange-400 to-red-500">🔍</ServiceIcon>, component: VideoAnalysisPanel },
    { id: 'audioAnalysis', icon: <ServiceIcon gradient="from-pink-400 to-rose-400">🎧</ServiceIcon>, component: AudioAnalysisPanel },
    { id: 'tts',      icon: <ServiceIcon gradient="from-cyan-400 to-light-blue-500">🔊</ServiceIcon>, component: TextToSpeechPanel },
    { id: 'text',     icon: <ServiceIcon gradient="from-gray-400 to-gray-500">📄</ServiceIcon>, component: TextPanel },
];

const LoginScreen = ({ onLogin }: { onLogin: (provider: 'google' | 'yandex') => void }) => {
    const { t } = useTranslation();
    return (
        <div className="h-screen bg-gray-100 flex items-center justify-center">
            <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-3xl shadow-lg text-center">
                <h1 className="text-2xl font-bold mb-2">{t('appTitle')}</h1>
                <p className="text-gray-500 mb-8">{t('login.subtitle')}</p>
                <div className="space-y-4">
                    <button onClick={() => onLogin('google')} className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 transition-colors">
                        <img src="https://www.google.com/favicon.ico" alt="" className="w-6 h-6" />
                        <span className="font-semibold">{t('login.google')}</span>
                    </button>
                    <button onClick={() => onLogin('yandex')} className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.166 12.9333H8.33398V20H12.166C16.035 20 17.804 17.588 17.804 15.3C17.804 13.012 16.035 12.9333 12.166 12.9333ZM12.166 4V10.8667H8.33398V4H4V20H5.75V11.8333H8.33398V20H12.166C18.286 20 20.334 16.6213 20.334 14.3333C20.334 11.5667 17.5 10.4 14.416 9.8L12.166 9.33333V4H12.166Z" fill="white"/></svg>
                        <span className="font-semibold">{t('login.yandex')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const SettingsPanel = ({ onBack, onLogout, user }: { onBack: () => void; onLogout: () => void; user: {name: string, email: string} }) => {
    const { t, i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setCurrentLanguage(lng);
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-gray-500 hover:text-gray-900">&larr;</button>
                <h2 className="text-xl font-bold">{t('settings.title')}</h2>
            </div>
            <div className="p-4 bg-gray-100 rounded-xl">
                 <p className="font-bold">{user.name}</p>
                 <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.language')}</label>
                 <select value={currentLanguage} onChange={(e) => changeLanguage(e.target.value)} className="w-full p-3 bg-gray-100 rounded-xl border-2 border-transparent focus:border-gray-300 focus:outline-none">
                     <option value="en">English</option>
                     <option value="ru">Русский</option>
                 </select>
            </div>
            <button onClick={onLogout} className="w-full py-3 px-4 rounded-xl text-red-600 bg-red-100 hover:bg-red-200 transition-colors">{t('settings.logout')}</button>
        </div>
    );
};


const AppContent: React.FC = () => {
    const { t } = useTranslation();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<{name: string, email: string} | null>(null);
    const [currentScreen, setCurrentScreen] = useState<'home' | 'settings' | string>('home');

    const handleLogin = (provider: 'google' | 'yandex') => {
        // Mock authentication
        setUser({ name: 'Content Creator', email: `creator@${provider}.com` });
        setIsAuthenticated(true);
    };
    const handleLogout = () => {
        setIsAuthenticated(false);
        setUser(null);
        setCurrentScreen('home');
    };

    const services: Service[] = servicesList.map(s => ({
        ...s,
        title: t(`services.${s.id}.title`),
        description: t(`services.${s.id}.description`),
    }));
    
    const activeService = services.find(s => s.id === currentScreen);
    const PanelComponent = activeService?.component;

    if (!isAuthenticated) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div className="max-w-md mx-auto bg-white h-screen overflow-hidden flex flex-col shadow-2xl rounded-3xl my-4">
           {currentScreen === 'home' ? (
                // Home Screen
                <div className="flex-1 overflow-y-auto">
                    <header className="p-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold">{t('appTitle')}</h1>
                        <button onClick={() => setCurrentScreen('settings')} className="text-gray-400 hover:text-gray-800">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        </button>
                    </header>
                    <main className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                            {services.map(service => (
                                <button key={service.id} onClick={() => setCurrentScreen(service.id)} className="bg-gray-100 p-4 rounded-2xl text-left hover:bg-gray-200 transition-colors space-y-2">
                                    {service.icon}
                                    <h3 className="font-bold text-gray-900">{service.title}</h3>
                                    <p className="text-xs text-gray-500">{service.description}</p>
                                </button>
                            ))}
                        </div>
                    </main>
                </div>
           ) : currentScreen === 'settings' ? (
                <SettingsPanel onBack={() => setCurrentScreen('home')} onLogout={handleLogout} user={user!} />
           ) : (
                // Service Panel
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="p-4 flex items-center gap-4 border-b">
                        <button onClick={() => setCurrentScreen('home')} className="text-gray-500 hover:text-gray-900">&larr;</button>
                        <div className="flex items-center gap-3">
                            {activeService?.icon}
                            <h2 className="text-xl font-bold">{activeService?.title}</h2>
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-4">
                        {PanelComponent && <PanelComponent />}
                    </main>
                </div>
           )}
        </div>
    );
};

const App: React.FC = () => (
    <I18nextProvider i18n={i18n}>
        <AppContent />
    </I18nextProvider>
);

export default App;