// --- 1. CẤU HÌNH API ---
window.DEFAULT_API_URL = "https://hoangthiencm-tkb.hf.space";

window.api = {
    getUrl: () => localStorage.getItem("api_url") || window.DEFAULT_API_URL,
    setUrl: (url) => localStorage.setItem("api_url", url),
    
    // Hàm lấy Session ID hiện tại
    getSessionId: () => localStorage.getItem("current_session_id"),
    setSessionId: (id, name) => {
        localStorage.setItem("current_session_id", id);
        localStorage.setItem("current_session_name", name);
    },
    
    call: async (endpoint, method = "GET", body = null) => {
        try {
            const headers = { "Content-Type": "application/json" };
            const config = { method, headers };
            if (body) config.body = JSON.stringify(body);
            
            // Xử lý URL để tránh duplicate dấu /
            const baseUrl = window.api.getUrl().replace(/\/$/, "");
            const res = await fetch(`${baseUrl}${endpoint}`, config);
            
            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                // --- SỬA LỖI HIỂN THỊ [object Object] ---
                let errMsg = `Lỗi API (${res.status}): ${res.statusText}`;
                
                if (errJson.detail) {
                    if (typeof errJson.detail === 'string') {
                        errMsg = errJson.detail;
                    } else if (Array.isArray(errJson.detail)) {
                        // Trường hợp lỗi validation (Pydantic) trả về mảng
                        errMsg = errJson.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n');
                    } else {
                        errMsg = JSON.stringify(errJson.detail);
                    }
                }
                throw new Error(errMsg);
                // ----------------------------------------
            }
            const json = await res.json();
            return json.data;
        } catch (err) {
            console.error("API Call Error:", err);
            alert("⚠️ " + err.message); // Hiển thị thông báo lỗi rõ ràng
            return null;
        }
    }
};

// --- 2. EXCEL HELPER ---
window.excel = {
    export: (data, filename) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, filename || "data.xlsx");
    },
    import: (file, callback) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            callback(json);
        };
        reader.readAsArrayBuffer(file);
    }
};

// --- 3. MENU CONFIG ---
const MENU_ITEMS = [
    { url: "index.html", label: "Tổng quan", icon: "🏠" },
    { url: "giaovien.html", label: "Giáo viên", icon: "👨‍🏫" },
    { url: "lophoc.html", label: "Lớp học", icon: "🏫" },
    { url: "monhoc.html", label: "Môn học", icon: "📚" },
    { url: "phancong.html", label: "Phân công", icon: "📅" },
    { url: "rangbuoc.html", label: "Ràng buộc", icon: "⚙️" },
    { url: "xeptkb.html", label: "Xếp TKB", icon: "🚀" },
    { url: "thongke.html", label: "Thống kê", icon: "📊" },
    { url: "inan.html", label: "In ấn", icon: "🖨️" },
];

// --- 4. REACT LAYOUT COMPONENT ---
window.AppLayout = ({ children }) => {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const [apiUrl, setApiUrl] = React.useState(window.api.getUrl());
    const [currentSession, setCurrentSession] = React.useState({
        id: localStorage.getItem("current_session_id"),
        name: localStorage.getItem("current_session_name") || "Chưa chọn đợt"
    });

    // Kiểm tra bắt buộc chọn session
    React.useEffect(() => {
        if (currentPath !== "index.html" && !currentSession.id) {
            // Không alert ngay để tránh spam, nhưng hiển thị giao diện cảnh báo
        }
    }, []);

    const saveUrl = () => {
        window.api.setUrl(apiUrl);
        alert("Đã lưu URL Backend! Trang sẽ tải lại.");
        window.location.reload();
    };

    const changeSession = () => {
        window.location.href = "index.html";
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r fixed h-full z-20 hidden md:block shadow-sm flex flex-col">
                <div className="p-6 border-b flex items-center gap-2 font-bold text-xl text-blue-700">
                    <span>SmartTKB</span>
                </div>
                
                {/* Session Info Box */}
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Đang làm việc với:</div>
                    <div className="font-bold text-blue-800 truncate" title={currentSession.name}>
                        {currentSession.name}
                    </div>
                    {currentPath !== "index.html" && (
                        <button onClick={changeSession} className="text-xs text-blue-600 underline mt-1 hover:text-blue-800">
                            Đổi đợt khác
                        </button>
                    )}
                </div>

                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    {MENU_ITEMS.map((item) => {
                        const isActive = currentPath === item.url;
                        return (
                            <a key={item.url} href={item.url}
                               className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                   isActive 
                                   ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600' 
                                   : 'text-gray-600 hover:bg-gray-100'
                               }`}>
                                <span>{item.icon}</span> {item.label}
                            </a>
                        );
                    })}
                </nav>
                
                <div className="p-4 border-t bg-gray-50">
                    <label className="text-xs font-bold text-gray-500 uppercase">Backend URL</label>
                    <div className="flex gap-1 mt-1">
                        <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} className="w-full text-xs border p-1 rounded" />
                        <button onClick={saveUrl} className="bg-blue-600 text-white p-1 rounded text-xs px-2">Lưu</button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 md:ml-64 p-8">
                <div className="max-w-7xl mx-auto">
                    {!currentSession.id && currentPath !== "index.html" ? (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-center">
                            <h3 className="font-bold text-lg">⚠️ Chưa chọn Đợt TKB</h3>
                            <p className="mb-2">Vui lòng quay lại trang Tổng quan để chọn Đơn vị và Năm học.</p>
                            <a href="index.html" className="inline-block bg-yellow-600 text-white px-4 py-2 rounded font-bold hover:bg-yellow-700">Quay về chọn Đợt</a>
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </main>
        </div>
    );
};
