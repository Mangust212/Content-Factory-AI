
// This file implements the application's interactions with the Gemini API.
// Fix: Create a new GoogleGenAI instance for each call to use the latest API key.
import { GoogleGenAI, Chat, Content, Modality } from '@google/genai';
import { ImageAspectRatio, VideoAspectRatio } from '../types';
import { fileToBase64 } from '../utils';

// Helper function to create a new GoogleGenAI instance.
// This ensures the latest API key from process.env is used,
// especially important for features like video generation where
// the user might select a key at runtime.
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });


export async function generateText(prompt: string): Promise<string> {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
}

export function createChat(history: Content[]): Chat {
  const ai = getAi();
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
  });
}

export async function generateImage(prompt: string, aspectRatio: ImageAspectRatio): Promise<string> {
  const ai = getAi();
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio,
    },
  });

  const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64ImageBytes}`;
}

export async function generateVideo(prompt: string, imageFile: File | null, aspectRatio: VideoAspectRatio): Promise<string> {
  const ai = getAi();
  let imagePayload;
  if (imageFile) {
    const base64Image = await fileToBase64(imageFile);
    imagePayload = {
      imageBytes: base64Image,
      mimeType: imageFile.type,
    };
  }

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    ...(imagePayload && { image: imagePayload }),
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio,
    },
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (downloadLink) {
    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
  }
  throw new Error('Video generation failed.');
}

export async function editImage(imageFile: File, prompt: string): Promise<string> {
    const ai = getAi();
    const base64Image = await fileToBase64(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: imageFile.type } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error('Image editing failed.');
}

/**
 * Uploads a file to the Gemini API File Service using a multipart request.
 * This allows sending metadata (like displayName) along with the file content,
 * which is more robust than a simple media upload and resolves INVALID_ARGUMENT errors.
 * @param file The file to upload.
 * @returns The file resource from the API, containing its name and URI.
 */
async function uploadFile(file: File): Promise<{ name: string; uri: string; }> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API key not found for file upload.");

    const formData = new FormData();

    // Part 1: The metadata (must be application/json)
    const metadata = {
        file: {
            displayName: file.name
        }
    };
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

    // Part 2: The file content
    formData.append('file', file);
    
    // Use the multipart upload endpoint.
    const uploadResponse = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?upload_type=multipart&key=${apiKey}`,
        {
            method: 'POST',
            body: formData,
            // Note: Content-Type is not set here. The browser automatically sets it
            // to 'multipart/form-data' with the correct boundary when using FormData.
        }
    );

    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("File upload failed:", errorText);
        throw new Error(`File upload failed: ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    return uploadResult.file;
}

export async function analyzeVideoContent(videoFile: File, prompt: string, onStateChange: (state: string) => void): Promise<string> {
    onStateChange('uploading');
    const uploadedFile = await uploadFile(videoFile);
    
    onStateChange('analyzing');
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
            parts: [
                { fileData: { mimeType: videoFile.type, fileUri: uploadedFile.uri } },
                { text: prompt },
            ],
        },
    });

    // Clean up the uploaded file (fire-and-forget)
    const apiKey = process.env.API_KEY;
    fetch(`https://generativelanguage.googleapis.com/v1beta/${uploadedFile.name}?key=${apiKey}`, { method: 'DELETE' });

    return response.text;
}

export async function analyzeAudioContent(audioFile: File, prompt: string, onStateChange: (state: string) => void): Promise<string> {
    onStateChange('uploading');
    const uploadedFile = await uploadFile(audioFile);

    onStateChange('analyzing');
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
            parts: [
                { fileData: { mimeType: audioFile.type, fileUri: uploadedFile.uri } },
                { text: prompt },
            ],
        },
    });
    
    // Clean up the uploaded file (fire-and-forget)
    const apiKey = process.env.API_KEY;
    fetch(`https://generativelanguage.googleapis.com/v1beta/${uploadedFile.name}?key=${apiKey}`, { method: 'DELETE' });
    
    return response.text;
}


export async function generateWithThinking(prompt: string): Promise<string> {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
        },
    });
    return response.text;
}

export async function textToSpeech(text: string): Promise<string> {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        // The API returns raw PCM audio data, so we return the raw base64 string for processing with AudioContext.
        return base64Audio;
    }
    throw new Error('Text-to-speech conversion failed.');
}
