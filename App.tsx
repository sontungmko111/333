
import React, { useState, useRef, useEffect } from 'react';
import { editOutfit } from './services/geminiService';
import { ImageState, HistoryItem } from './types';

const App: React.FC = () => {
  const [imageState, setImageState] = useState<ImageState>({
    original: null,
    reference: null,
    modified: null,
    loading: false,
    error: null,
  });
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const originalInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (type: 'original' | 'reference') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageState(prev => ({
          ...prev,
          [type]: event.target?.result as string,
          modified: null,
          error: null
        }));
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const generateFaceSwap = async () => {
    if (!imageState.original || !imageState.reference) {
      setImageState(prev => ({ ...prev, error: "Vui lòng chọn đủ 2 ảnh trước khi bắt đầu." }));
      return;
    }

    setImageState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const modifiedImage = await editOutfit(imageState.original, imageState.reference, prompt);
      setImageState(prev => ({
        ...prev,
        modified: modifiedImage,
        loading: false,
      }));

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        original: imageState.original,
        reference: imageState.reference,
        modified: modifiedImage,
        prompt: prompt || "Face Swap AI",
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setImageState(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
    }
  };

  const downloadImage = () => {
    if (!imageState.modified) return;
    const link = document.createElement("a");
    link.href = imageState.modified;
    link.download = `faceswap-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#fafbff] pb-24 font-sans antialiased text-slate-900">
      <input type="file" ref={originalInputRef} onChange={handleFileUpload('original')} className="hidden" accept="image/*" />
      <input type="file" ref={referenceInputRef} onChange={handleFileUpload('reference')} className="hidden" accept="image/*" />

      {/* Modern Glassmorphism Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/><path d="M7 16s1-1 5-1 5 1 5 1"/></svg>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-800">Face<span className="text-indigo-600">Swap</span></h1>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mt-0.5">Professional Edition</p>
            </div>
          </div>
          <button 
            onClick={() => setImageState({ original: null, reference: null, modified: null, loading: false, error: null })}
            className="text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest py-2 px-4 rounded-xl hover:bg-indigo-50"
          >
            Làm mới trang
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-9 space-y-10">
            {/* Steps & Guidelines */}
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                <span>Tải mặt nguồn</span>
              </div>
              <div className="w-4 h-px bg-slate-200"></div>
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                <span>Tải ảnh mẫu</span>
              </div>
              <div className="w-4 h-px bg-slate-200"></div>
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-[10px]">3</span>
                <span>Nhận kết quả</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Photo 1 Upload */}
              <div className="group">
                <div 
                  onClick={() => originalInputRef.current?.click()}
                  className={`relative aspect-square rounded-[3rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${imageState.original ? 'border-indigo-100 shadow-2xl shadow-indigo-100' : 'border-slate-200 hover:border-indigo-400 bg-white shadow-sm hover:shadow-xl'}`}
                >
                  {imageState.original ? (
                    <img src={imageState.original} className="w-full h-full object-cover" alt="Source" />
                  ) : (
                    <div className="text-center p-10">
                      <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <h4 className="font-black text-slate-800 uppercase text-sm">Tải ảnh mặt gốc</h4>
                      <p className="text-slate-400 text-xs mt-3 leading-relaxed">Chọn ảnh rõ mặt, không che chắn<br/>để đạt kết quả tốt nhất.</p>
                    </div>
                  )}
                  {imageState.original && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <span className="bg-white text-slate-900 px-6 py-2 rounded-full text-xs font-black uppercase">Thay đổi ảnh</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo 2 Upload */}
              <div className="group">
                <div 
                  onClick={() => referenceInputRef.current?.click()}
                  className={`relative aspect-square rounded-[3rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${imageState.reference ? 'border-purple-100 shadow-2xl shadow-purple-100' : 'border-slate-200 hover:border-purple-400 bg-white shadow-sm hover:shadow-xl'}`}
                >
                  {imageState.reference ? (
                    <img src={imageState.reference} className="w-full h-full object-cover" alt="Target" />
                  ) : (
                    <div className="text-center p-10">
                      <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <h4 className="font-black text-slate-800 uppercase text-sm">Tải ảnh mẫu đích</h4>
                      <p className="text-slate-400 text-xs mt-3 leading-relaxed">Ảnh có thân hình, trang phục<br/>mà bạn muốn ghép mặt vào.</p>
                    </div>
                  )}
                  {imageState.reference && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <span className="bg-white text-slate-900 px-6 py-2 rounded-full text-xs font-black uppercase">Thay đổi ảnh</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Prompt & Action */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 relative">
                  <input 
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Mô tả thêm (VD: Làm sáng da, giữ nụ cười...)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all text-sm font-semibold"
                  />
                </div>
                <button
                  onClick={generateFaceSwap}
                  disabled={!imageState.original || !imageState.reference || imageState.loading}
                  className={`md:w-72 h-[60px] rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center space-x-3 shadow-lg ${(!imageState.original || !imageState.reference || imageState.loading) ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 hover:-translate-y-1 active:scale-95'}`}
                >
                  {imageState.loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>Ghép mặt ngay</span>
                  )}
                </button>
              </div>

              {imageState.error && (
                <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-red-900 uppercase tracking-tight">Cảnh báo hệ thống</h5>
                      <p className="text-red-700 text-xs mt-1 leading-relaxed font-medium">{imageState.error}</p>
                      {imageState.error.includes("IMAGE_SAFETY") && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="text-[10px] bg-white/50 p-2 rounded-lg border border-red-200">
                            <strong>Mẹo 1:</strong> Tránh ảnh có góc chụp quá gần hoặc quá gợi cảm.
                          </div>
                          <div className="text-[10px] bg-white/50 p-2 rounded-lg border border-red-200">
                            <strong>Mẹo 2:</strong> Đảm bảo gương mặt được chiếu sáng đều, không bị tối.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Result Display */}
            {imageState.modified && (
              <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl shadow-indigo-500/10 border border-indigo-50 flex flex-col items-center animate-in zoom-in duration-700">
                <div className="text-center mb-10">
                  <div className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Kết quả hoàn tất</div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Gương mặt đã được hoán đổi</h3>
                </div>
                
                <div className="max-w-2xl w-full aspect-square bg-slate-50 rounded-[3rem] overflow-hidden border border-slate-100 shadow-inner group relative">
                  <img src={imageState.modified} className="w-full h-full object-contain" alt="Face Swap Final Result" />
                  <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors pointer-events-none"></div>
                </div>
                
                <div className="mt-12 flex flex-col md:flex-row gap-4 w-full max-w-lg">
                  <button 
                    onClick={downloadImage}
                    className="flex-1 bg-slate-900 text-white h-[64px] rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>Lưu ảnh 4K</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Side History */}
          <div className="lg:col-span-3">
            <div className="sticky top-32 space-y-8">
              <div>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center">
                  <span className="w-10 h-px bg-slate-200 mr-4"></span>
                  Gần đây
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-5 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-100 rounded-[2rem] p-8 text-center bg-white/50">
                      <p className="text-slate-300 text-[9px] font-black uppercase tracking-widest leading-loose">Không có ảnh<br/>đã tạo</p>
                    </div>
                  ) : (
                    history.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => setImageState(prev => ({ ...prev, original: item.original, reference: item.reference, modified: item.modified, error: null }))}
                        className="bg-white rounded-3xl p-2 border border-slate-100 hover:border-indigo-400 hover:scale-[1.03] transition-all cursor-pointer shadow-sm group relative overflow-hidden"
                      >
                        <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50">
                          <img src={item.modified} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="History Item" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <h4 className="text-xs font-black uppercase tracking-widest mb-3 relative z-10">Mẹo nhỏ</h4>
                <p className="text-[11px] leading-relaxed font-medium opacity-80 relative z-10">Sử dụng ảnh chân dung có gương mặt chiếm 50% khung hình để AI nhận diện danh tính tốt nhất.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 mt-32 text-center border-t border-slate-100 pt-16 pb-16">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">&copy; 2024 FaceSwap Studio &bull; Gemini Flash Powered</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default App;
