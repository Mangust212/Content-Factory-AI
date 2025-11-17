import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          appTitle: 'Content Factory',
          login: {
            subtitle: 'AI-powered content creation suite',
            google: 'Sign in with Google',
            yandex: 'Sign in with Yandex',
          },
          settings: {
            title: 'Settings',
            language: 'Language',
            logout: 'Log Out',
          },
          services: {
            text: { title: 'Text Gen', description: 'Create articles and copy' },
            chat: { title: 'Chat Assistant', description: 'Your creative partner' },
            imageGen: { title: 'Image Gen', description: 'Generate unique visuals' },
            videoGen: { title: 'Video Gen', description: 'Text or image to video' },
            imageEdit: { title: 'Image Editor', description: 'Retouch and modify' },
            videoAnalysis: { title: 'Video Analysis', description: 'Get insights from video' },
            audioAnalysis: { title: 'Audio Analysis', description: 'Transcribe and analyze audio' },
            thinking: { title: 'Deep Analysis', description: 'For complex queries' },
            tts: { title: 'Text to Speech', description: 'Voiceovers and audio' },
          },
          promptLabel: 'Enter your prompt here...',
          prompt: {
            editImage: 'Describe the edits you want to make...',
            analyzeVideo: 'What do you want to know about this video?',
            analyzeVideo_default: 'Generate a text summary, highlight key speakers, main points, and suggest social media cards with quotes.',
            analyzeAudio: 'What do you want to know about this audio?',
            analyzeAudio_default: 'Transcribe the audio and provide a summary of the key topics.',
            thinking: 'Enter a complex prompt for advanced reasoning...',
            tts: 'Enter text to convert to speech...'
          },
          chat: {
            placeholder: 'Ask anything...'
          },
          submitButton: 'Generate',
          loading: 'Generating...',
          uploading: 'Uploading file...',
          analyzing: 'Analyzing...',
          error: 'An error occurred. Please try again.',
          error_noImage: 'Please upload an image first.',
          error_noVideo: 'Please upload a video first.',
          error_noAudio: 'Please upload an audio file first.',
          error_audioPlayback: 'Could not play audio.',
          aspectRatio: 'Aspect Ratio',
          uploadImage: 'Upload Image',
          uploadImageOptional: 'Upload Starting Image (Optional)',
          uploadVideo: 'Upload Video',
          uploadAudio: 'Upload Audio',
          playAudio: 'Generate & Play Audio',
          selectApiKey: 'Select API Key',
          apiKeyNeeded: {
            title: 'API Key Required',
            body: 'To use video generation, please select a project with an enabled API key.',
          },
          apiKeyError: 'API key validation failed. Please select a new key.',
          billingInfo: 'This is a billable feature.',
          billingLink: 'https://ai.google.dev/gemini-api/docs/billing',
          videoGenWait: 'Video generation can take a few minutes. Please be patient.',
          thinking: {
            description: 'This feature uses Gemini 2.5 Pro with a high thinking budget for complex tasks like coding, math, and advanced reasoning.'
          },
          imageGen: { alt: 'Generated image' },
          imageEdit: { alt: 'Edited image' },
        },
      },
      ru: {
        translation: {
          appTitle: 'Фабрика контента',
          login: {
            subtitle: 'Создание контента с помощью ИИ',
            google: 'Войти через Google',
            yandex: 'Войти через Яндекс',
          },
          settings: {
            title: 'Настройки',
            language: 'Язык',
            logout: 'Выйти',
          },
          services: {
            text: { title: 'Генерация текста', description: 'Создавайте статьи и тексты' },
            chat: { title: 'Чат-помощник', description: 'Ваш творческий партнер' },
            imageGen: { title: 'Генерация изображений', description: 'Создавайте уникальные визуалы' },
            videoGen: { title: 'Генерация видео', description: 'Текст или изображение в видео' },
            imageEdit: { title: 'Редактор изображений', description: 'Ретушируйте и изменяйте' },
            videoAnalysis: { title: 'Анализ видео', description: 'Получайте инсайты из видео' },
            audioAnalysis: { title: 'Анализ аудио', description: 'Транскрибируйте и анализируйте' },
            thinking: { title: 'Глубокий анализ', description: 'Для сложных запросов' },
            tts: { title: 'Текст в речь', description: 'Озвучка и аудио' },
          },
          promptLabel: 'Введите ваш запрос здесь...',
          prompt: {
            editImage: 'Опишите правки, которые вы хотите внести...',
            analyzeVideo: 'Что вы хотите узнать из этого видео?',
            analyzeVideo_default: 'Сгенерируй текстовое резюме, выдели ключевых спикеров, основные моменты и предложи карточки для соцсетей с цитатами.',
            analyzeAudio: 'Что вы хотите узнать из этого аудио?',
            analyzeAudio_default: 'Транскрибируй аудио и предоставь краткое изложение ключевых тем.',
            thinking: 'Введите сложный запрос для продвинутого анализа...',
            tts: 'Введите текст для преобразования в речь...'
          },
          chat: {
            placeholder: 'Спросите что-нибудь...'
          },
          submitButton: 'Сгенерировать',
          loading: 'Генерация...',
          uploading: 'Загрузка файла...',
          analyzing: 'Анализ...',
          error: 'Произошла ошибка. Пожалуйста, попробуйте еще раз.',
          error_noImage: 'Сначала загрузите изображение.',
          error_noVideo: 'Сначала загрузите видео.',
          error_noAudio: 'Сначала загрузите аудиофайл.',
          error_audioPlayback: 'Не удалось воспроизвести аудио.',
          aspectRatio: 'Соотношение сторон',
          uploadImage: 'Загрузить изображение',
          uploadImageOptional: 'Загрузить стартовое изображение (необязательно)',
          uploadVideo: 'Загрузить видео',
          uploadAudio: 'Загрузить аудио',
          playAudio: 'Сгенерировать и прослушать',
          selectApiKey: 'Выбрать API ключ',
          apiKeyNeeded: {
            title: 'Требуется API ключ',
            body: 'Для генерации видео выберите проект с активированным API ключом.',
          },
          apiKeyError: 'Ошибка проверки API ключа. Выберите новый ключ.',
          billingInfo: 'Это платная функция.',
          billingLink: 'https://ai.google.dev/gemini-api/docs/billing',
          videoGenWait: 'Генерация видео может занять несколько минут. Пожалуйста, подождите.',
          thinking: {
            description: 'Эта функция использует Gemini 2.5 Pro с высоким бюджетом на "размышления" для сложных задач, таких как программирование, математика и продвинутый анализ.'
          },
          imageGen: { alt: 'Сгенерированное изображение' },
          imageEdit: { alt: 'Отредактированное изображение' },
        },
      }
    },
  });

export default i18n;
