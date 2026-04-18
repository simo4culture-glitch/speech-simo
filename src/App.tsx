import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Play, Square, Sparkles, Youtube, Volume2, Settings, MessageSquare, Loader2, Download, Music, Zap, Heart, PartyPopper } from 'lucide-react';
import { generateTTSSpeech } from './services/ttsService';
import { playPcmAudio, encodeWAV } from './lib/audioUtils';

// Constants for Arabic presets
const PRESETS = [
  {
    title: "مقدمة ترحيبية",
    text: "مرحبًا بأفضل المتابعين! اليوم أقدم لكم فيديو مميزًا للغاية، لكن قبل أن نبدأ لا تنسوا الإعجاب والاشتراك في القناة!",
    icon: <Sparkles className="w-4 h-4" />
  },
  {
    title: "مراجعة منتج",
    text: "أصدقائي، هذا المنتج سعره مئة درهم فقط، وبصراحة أداؤه كان رائعًا مقارنة بسعره. جرّبوه وأخبروني بآرائكم في التعليقات.",
    icon: <Settings className="w-4 h-4" />
  },
  {
    title: "تفاعل مع الجمهور",
    text: "ما رأيكم في هذا الشرح؟ هل استفدتم منه؟ دعوني أعرف في التعليقات وسأقوم بالرد على أسئلتكم فورًا. تابعوا معي للنهاية!",
    icon: <MessageSquare className="w-4 h-4" />
  }
];

// Sound Effects Constants
const SFX = [
  { name: "هواء مضغوط", icon: <Zap className="w-4 h-4" />, url: "https://www.myinstants.com/media/sounds/mlg-air-horn.mp3" },
  { name: "تصفيق", icon: <Heart className="w-4 h-4" />, url: "https://actions.google.com/sounds/v1/human/applause.ogg" },
  { name: "ضحك", icon: <MessageSquare className="w-4 h-4" />, url: "https://actions.google.com/sounds/v1/human/crowd_laughing.ogg" },
  { name: "احتفال", icon: <PartyPopper className="w-4 h-4" />, url: "https://actions.google.com/sounds/v1/impacts/crash_cymbal.ogg" }
];

export default function App() {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voice, setVoice] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' | 'Algieba' | 'Algenib'>('Algieba');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [lastGeneratedAudio, setLastGeneratedAudio] = useState<string | null>(null);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  
  const audioRef = useRef<{ stop: () => void } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  const handleGenerateAndPlay = async () => {
    if (!text.trim() || isGenerating) return;

    try {
      setIsGenerating(true);
      if (audioRef.current) audioRef.current.stop();
      
      const base64Audio = await generateTTSSpeech({
        text,
        voiceName: voice,
        speed: speed,
        pitch: pitch,
      });

      setLastGeneratedAudio(base64Audio);
      setIsPlaying(true);
      const audioControl = await playPcmAudio(base64Audio, volume);
      audioRef.current = audioControl;
      
      audioControl.onEnded(() => {
        setIsPlaying(false);
      });
    } catch (error) {
      alert("عذرًا، حدث خطأ أثناء توليد الصوت.");
    } finally {
      setIsGenerating(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleExport = () => {
    if (!lastGeneratedAudio) return;
    
    const wavData = encodeWAV(lastGeneratedAudio);
    const blob = new Blob([wavData], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtuber_audio_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const playSFX = (url: string) => {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play();
  };

  const embedSFX = (name: string) => {
    setText(prev => prev + ` [${name}] `);
  };

  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordingChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordingChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my_recording_${Date.now()}.wav`;
        a.click();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingMic(true);
    } catch (err) {
      alert("تعذر الوصول إلى الميكروفون. يرجى التأكد من إعطاء الصلاحية.");
    }
  };

  const stopMicRecording = () => {
    if (mediaRecorderRef.current && isRecordingMic) {
      mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
    }
  };

  return (
    <div className="min-h-screen studio-grid p-4 md:p-8 font-sans" dir="rtl">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 action-gradient rounded-full flex items-center justify-center shadow-lg shadow-red-500/20">
              <Youtube className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-1">يوتيوبر العرب AI</h1>
              <p className="text-white/60 text-sm font-medium">حوّل نصوصك إلى صوت حقيقي وبأسلوب كاريزمي</p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap justify-center md:justify-end">
            {(['Fenrir', 'Zephyr', 'Kore', 'Algieba', 'Algenib'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVoice(v)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  voice === v 
                    ? 'bg-white text-black shadow-lg' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {v === 'Fenrir' ? 'بسام' : v === 'Zephyr' ? 'زيد' : v === 'Kore' ? 'ليلى' : v === 'Algieba' ? 'نجم' : 'ساري'}
              </button>
            ))}
          </div>
        </header>

        {/* Main Interface */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glossy-card p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-red-500">
                  <Mic className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-widest text-xs">نص الحلقة</span>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <span>اللغة: العربية الفصحى</span>
                </div>
              </div>
              
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="اكتب هنا النص الذي تريد تحويله إلى صوت يوتيوبر..."
                className="w-full h-48 bg-transparent border-none text-xl leading-relaxed text-white placeholder:text-white/20 resize-none focus:ring-0"
              />
              
              <div className="border-t border-white/10 pt-6 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerateAndPlay}
                      disabled={isGenerating || !text.trim() || isRecordingMic}
                      className={`flex items-center gap-3 px-8 py-3 rounded-xl font-bold transition-all shadow-xl shadow-red-500/20 w-full md:w-auto justify-center ${
                        isGenerating || !text.trim() || isRecordingMic
                          ? 'bg-white/10 text-white/30 cursor-not-allowed'
                          : 'action-gradient text-white active:brightness-90'
                      }`}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                      {isGenerating ? "جاري التوليد..." : "توليد الصوت"}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={isRecordingMic ? stopMicRecording : startMicRecording}
                      disabled={isGenerating}
                      className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all w-full md:w-auto justify-center ${
                        isRecordingMic
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <Mic className="w-5 h-5" />
                      {isRecordingMic ? "إيقاف التسجيل" : "تسجيل صوتي"}
                    </motion.button>

                    <AnimatePresence>
                      {isPlaying && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={stopAudio}
                          className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                          <Square className="w-5 h-5 text-white" fill="currentColor" />
                        </motion.button>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {lastGeneratedAudio && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={handleExport}
                          title="تصدير كـ WAV"
                          className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors border border-green-500/20"
                        >
                          <Download className="w-5 h-5 text-green-500" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-col gap-4 w-full md:w-64">
                    <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                        <span>السرعة</span>
                        <span>{speed.toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="1.5" 
                        step="0.1" 
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-full accent-red-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                        <span>نبرة الصوت</span>
                        <span>{pitch.toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="1.5" 
                        step="0.1" 
                        value={pitch}
                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                        className="w-full accent-red-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                        <span>مستوى الصوت</span>
                        <span>{Math.round(volume * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full accent-red-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-white/40 text-[10px] md:text-xs">
                  <div className="flex items-center gap-4">
                    <span>اللغة: العربية الفصحى</span>
                    <AnimatePresence>
                      {lastGeneratedAudio && (
                        <motion.button
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={handleExport}
                          className="text-green-500 hover:text-green-400 font-bold flex items-center gap-1 transition-colors border-r border-white/10 pr-4"
                        >
                          <Download className="w-3 h-3" />
                          تحميل الصوت النهائي (WAV)
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                  <span>{text.length} حرف</span>
                </div>
              </div>
            </div>

            {/* Visualizer Simulation */}
            <div className="glossy-card p-4 h-16 flex items-center justify-center gap-1 overflow-hidden">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: isPlaying 
                      ? [8, Math.random() * 24 + 8, 8, Math.random() * 24 + 8, 8]
                      : [8, 8, 8]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.05
                  }}
                  className="w-1 bg-red-500/40 rounded-full"
                  style={{ height: '8px' }}
                />
              ))}
            </div>
          </div>

          {/* Sidebar / Presets */}
          <aside className="space-y-4">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest px-2">أمثلة سريعة</h3>
            <div className="space-y-3">
              {PRESETS.map((preset, index) => (
                <motion.button
                  key={index}
                  whileHover={{ x: 5 }}
                  onClick={() => setText(preset.text)}
                  className="w-full text-right p-4 glossy-card hover:bg-white/10 transition-all flex flex-col gap-2 group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-white group-hover:text-red-500 transition-colors">
                      {preset.title}
                    </span>
                    <div className="p-1.5 rounded-lg bg-white/5 text-white/50 group-hover:text-red-500">
                      {preset.icon}
                    </div>
                  </div>
                  <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                    {preset.text}
                  </p>
                </motion.button>
              ))}
            </div>

            <div className="p-6 glossy-card bg-red-500/5 border-red-500/10">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Music className="w-4 h-4 text-red-500" />
                <span>لوحة المؤثرات (Soundboard)</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {SFX.map((effect, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <button
                      onClick={() => playSFX(effect.url)}
                      className="flex items-center justify-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold transition-all border border-white/5"
                    >
                      {effect.icon}
                      {effect.name}
                    </button>
                    <button
                      onClick={() => embedSFX(effect.name)}
                      className="text-[9px] text-white/30 hover:text-white/60 text-center"
                    >
                      + إضافة للنص
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 glossy-card bg-white/5 border-white/10">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" />
                <span>نصيحة المبدع</span>
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                للحصول على أفضل النتائج، حاول استخدام الوقفات والتعابير الحماسية. الذكاء الاصطناعي سيفهم نبرة صوتك ويجعلها أكثر واقعية!
              </p>
            </div>
          </aside>
        </main>

        {/* Footer */}
        <footer className="pt-12 pb-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-white/40 text-xs">
          <p>© 2026 يوتيوبر العرب AI. صنع بكل حب لصنّاع المحتوى العربي.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-white transition-colors">عن التطبيق</a>
            <a href="#" className="hover:text-white transition-colors">تواصل معنا</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
