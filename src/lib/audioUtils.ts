/**
 * Utility to play raw PCM audio data returned by Gemini TTS.
 */
export async function playPcmAudio(base64Data: string, volume: number = 1.0, sampleRate: number = 24000) {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Raw PCM is 16-bit little-endian
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  const audioBuffer = audioContext.createBuffer(1, float32Array.length, sampleRate);
  audioBuffer.getChannelData(0).set(float32Array);

  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  
  source.buffer = audioBuffer;
  gainNode.gain.value = volume;
  
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  source.start();
  
  return {
    stop: () => source.stop(),
    onEnded: (callback: () => void) => {
      source.onended = callback;
    }
  };
}

/**
 * Encodes PCM audio data to WAV format.
 */
export function encodeWAV(base64Data: string, sampleRate: number = 24000) {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + bytes.length, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM - integer
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, bytes.length, true);

  const combined = new Uint8Array(wavHeader.byteLength + bytes.length);
  combined.set(new Uint8Array(wavHeader), 0);
  combined.set(bytes, wavHeader.byteLength);

  return combined;
}
