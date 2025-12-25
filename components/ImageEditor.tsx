
import React, { useState, useRef } from 'react';
import { editImageWithGemini } from '../services/geminiService';

const SUGGESTIONS = [
  {
    id: 'elegant',
    label: 'Mesa Elegante',
    prompt: 'Transforme a decoração para uma mesa posta elegante com cristais, prataria e arranjos florais altos em tons de branco e dourado.',
    icon: '🍽️'
  },
  {
    id: 'outdoor',
    label: 'Casamento Garden',
    prompt: 'Adicione um arco de flores rústico e natural, ideal para um casamento ao ar livre no jardim ao entardecer.',
    icon: '🌸'
  },
  {
    id: 'lighting',
    label: 'Luzes Modernas',
    prompt: 'Altere a iluminação do local para um tom cênico moderno com luzes LED em tons de azul e violeta e efeitos de fumaça leve.',
    icon: '💡'
  },
  {
    id: 'balloons',
    label: 'Painel de Balões',
    prompt: 'Adicione um painel de balões orgânicos desconstruídos em tons pastel e acabamento metálico para um fundo de fotos.',
    icon: '🎈'
  }
];

const ImageEditor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setEditedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlLoad = async () => {
    if (!imageUrlInput) return;
    setIsUrlLoading(true);
    try {
      const response = await fetch(imageUrlInput);
      if (!response.ok) throw new Error('Falha ao carregar a imagem da URL');
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEditedImage(null);
        setImageUrlInput('');
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar imagem da URL. Verifique se o link é válido e permite acesso externo (CORS).");
    } finally {
      setIsUrlLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!originalImage || !prompt) return;

    setIsProcessing(true);
    try {
      const base64Data = originalImage.split(',')[1];
      const result = await editImageWithGemini(base64Data, prompt);
      if (result) {
        setEditedImage(result);
      } else {
        alert("Não foi possível processar a imagem. Tente um prompt diferente.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao editar imagem. Verifique sua chave API.");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">AI Event Photo Editor</h2>
        <p className="text-slate-500">Visualize transformações criativas no seu local de evento com poder da IA.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Editor Controls */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6">
            {!originalImage ? (
              <div className="space-y-6">
                <div 
                  onClick={triggerUpload}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition cursor-pointer group"
                >
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <p className="text-slate-600 font-medium">Faça upload de um arquivo</p>
                  <p className="text-slate-400 text-sm mt-1">PNG ou JPG até 10MB</p>
                </div>

                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">ou cole um link</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm font-medium"
                  />
                  <button 
                    onClick={handleUrlLoad}
                    disabled={!imageUrlInput || isUrlLoading}
                    className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUrlLoading ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : 'Carregar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <img src={originalImage} alt="Original" className="w-full aspect-video object-cover rounded-xl shadow-inner border border-slate-100" />
                <button 
                  onClick={() => setOriginalImage(null)}
                  className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-xl">
                  <p className="text-white text-sm font-medium">Imagem selecionada</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-tight">Instrução de Edição</label>
              <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Descreva o que deseja alterar..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition min-h-[100px] resize-none text-slate-700 font-medium"
              />
              
              <button 
                disabled={!originalImage || !prompt || isProcessing}
                onClick={handleEdit}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${
                  isProcessing ? 'bg-indigo-400 cursor-not-allowed text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-100'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando com Gemini...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    Gerar Edição AI
                  </>
                )}
              </button>

              {/* AI Image Suggestions Section */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sugestões de Design</p>
                <div className="grid grid-cols-2 gap-3">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => setPrompt(suggestion.prompt)}
                      className="group flex flex-col items-start p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition text-left relative overflow-hidden"
                    >
                      <span className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-300">{suggestion.icon}</span>
                      <span className="text-xs font-bold text-slate-700">{suggestion.label}</span>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="bg-slate-900/5 rounded-2xl border-2 border-dashed border-slate-200 p-2 flex flex-col min-h-[400px]">
          {editedImage ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 bg-white rounded-xl overflow-hidden shadow-2xl relative">
                <img src={editedImage} alt="Edited" className="w-full h-full object-contain" />
                <div className="absolute top-4 right-4 flex gap-2">
                   <a 
                    href={editedImage} 
                    download="event-photo-ai.png"
                    className="p-3 bg-white/90 backdrop-blur-sm text-indigo-600 rounded-xl shadow-lg hover:bg-white transition"
                   >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                   </a>
                </div>
              </div>
              <div className="mt-6 p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2">Resultado da IA</h4>
                <p className="text-slate-600 text-sm italic leading-relaxed">"{prompt}"</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
               <div className="w-24 h-24 mb-6 opacity-20">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                   <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
               </div>
               <p className="text-xl font-medium max-w-xs">Sua imagem editada pela IA aparecerá aqui.</p>
               {isProcessing && (
                 <div className="mt-6 flex flex-col items-center">
                   <div className="flex gap-1 mb-2">
                     <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                     <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                     <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                   <p className="text-indigo-500 font-bold text-sm">O Gemini está reimaginando seu evento...</p>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
    </div>
  );
};

export default ImageEditor;
