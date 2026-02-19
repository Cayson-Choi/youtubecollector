import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle2, Upload } from 'lucide-react';

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// Helper function for fetch with retry
async function fetchWithRetry(url, options = {}, retries = RETRY_ATTEMPTS) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30s timeout
      });
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
}

export default function ChannelManager({ onClose }) {
  const [channels, setChannels] = useState([]);
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState('');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const res = await fetchWithRetry(`${API_URL}/api/channels`);
      if (res.ok) {
        setChannels(await res.json());
      } else {
        throw new Error('Failed to load channels');
      }
    } catch (e) {
      console.error("Failed to load channels:", e.message);
      setError('서버에 연결할 수 없습니다. server.js가 실행 중인지 확인하세요.');
    }
  };

  const handleAddChannel = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchWithRetry(`${API_URL}/api/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl })
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMessage = data.error || 'Failed to add channel';

        // User-friendly error messages
        if (res.status === 400) {
          throw new Error('잘못된 URL 형식입니다. YouTube 채널 URL을 확인하세요.');
        } else if (res.status === 404) {
          throw new Error('채널을 찾을 수 없습니다. URL을 다시 확인하세요.');
        } else if (res.status === 409) {
          throw new Error('이미 등록된 채널입니다.');
        } else if (res.status === 403) {
          throw new Error('API 할당량이 초과되었습니다. 나중에 다시 시도하세요.');
        } else {
          throw new Error(errorMessage);
        }
      }

      await loadChannels();
      setInputUrl('');
      setError(null);
    } catch (err) {
      if (err.name === 'TimeoutError') {
        setError('요청 시간이 초과되었습니다. 다시 시도하세요.');
      } else if (err.message.includes('fetch')) {
        setError('서버에 연결할 수 없습니다. server.js가 실행 중인지 확인하세요.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetchWithRetry(`${API_URL}/api/channels/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setChannels(channels.filter(c => c.id !== id));
        setError(null);
      } else {
        throw new Error('Failed to delete channel');
      }
    } catch (e) {
      console.error(e);
      setError('채널 삭제에 실패했습니다.');
    }
  };

  const handleRunFetch = async () => {
    setIsFetching(true);
    setError(null);

    try {
      const res = await fetchWithRetry(`${API_URL}/api/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 7 })
      });

      if (res.ok) {
        alert('✅ 영상 수집이 완료되었습니다!\n\n페이지를 새로고침합니다.');
        window.location.reload();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Fetch failed');
      }
    } catch (e) {
      if (e.name === 'TimeoutError') {
        alert('⚠️ 요청 시간이 초과되었습니다.\n수집은 백그라운드에서 계속 진행될 수 있습니다.');
      } else {
        alert(`❌ 오류가 발생했습니다: ${e.message}`);
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleDeploy = async () => {
    if (!confirm('영상을 수집하고 GitHub에 자동으로 커밋/푸시합니다. 계속하시겠습니까?')) {
      return;
    }

    setIsDeploying(true);
    setDeployProgress('배포 시작...');
    setError(null);

    try {
      setDeployProgress('영상 수집 중...');
      const res = await fetchWithRetry(`${API_URL}/api/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 7 })
      }, 1); // Only 1 retry for deploy

      const data = await res.json();

      if (res.ok) {
        setDeployProgress('배포 완료!');
        alert(`✅ 배포 완료!\n${data.message}\n\n페이지를 새로고침합니다.`);
        window.location.reload();
      } else {
        throw new Error(data.message || data.error || 'Deployment failed');
      }
    } catch (e) {
      setDeployProgress('');
      if (e.name === 'TimeoutError') {
        alert('⚠️ 요청 시간이 초과되었습니다.\n배포는 백그라운드에서 계속 진행될 수 있습니다.');
      } else if (e.message.includes('fetch')) {
        alert('❌ 서버에 연결할 수 없습니다.\nserver.js가 실행 중인지 확인하세요.');
      } else {
        alert(`❌ 배포 실패: ${e.message}`);
      }
    } finally {
      setIsDeploying(false);
      setDeployProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">채널 관리자</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Area */}
        <div className="p-6 pb-2">
           <form onSubmit={handleAddChannel} className="relative">
              <input 
                type="text" 
                placeholder="YouTube 채널 주소 붙여넣기 (예: https://youtube.com/@handle)"
                value={inputUrl}
                onChange={(e) => {
                    try {
                        setInputUrl(decodeURIComponent(e.target.value));
                    } catch (err) {
                        setInputUrl(e.target.value);
                    }
                }}
                className="w-full pl-4 pr-12 py-3 bg-zinc-950 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-zinc-600 outline-none"
              />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                 {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </button>
           </form>
           {error && (
             <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-2 rounded-lg">
                <AlertCircle className="w-3 h-3" />
                {error}
             </div>
           )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2">
           <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">구독중인 채널 ({channels.length})</h3>
           {channels.length === 0 && (
               <div className="text-center py-8 text-zinc-600 text-sm">
                   아직 등록된 채널이 없습니다.
               </div>
           )}
           {channels.map((channel) => (
             <div key={channel.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                      {channel.title.charAt(0)}
                   </div>
                   <div>
                       <div className="text-sm font-semibold text-zinc-200">{channel.title}</div>
                       <div className="text-[10px] text-zinc-500">{channel.handle}</div>
                   </div>
                </div>
                <button 
                    onClick={() => handleDelete(channel.id)}
                    className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
             </div>
           ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-zinc-950/50 rounded-b-3xl space-y-3">
            <button
                onClick={handleRunFetch}
                disabled={isFetching || isDeploying}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 text-white hover:bg-white/20 font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
                {isFetching ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        최신 영상 수집중...
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="w-4 h-4" />
                        수집 시작하기
                    </>
                )}
            </button>

            <button
                onClick={handleDeploy}
                disabled={isDeploying || isFetching}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
                {isDeploying ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {deployProgress || '배포중... (수집 → 커밋 → 푸시)'}
                    </>
                ) : (
                    <>
                        <Upload className="w-4 h-4" />
                        배포하기 (GitHub)
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
}
