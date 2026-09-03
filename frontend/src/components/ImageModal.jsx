import { useState, useEffect } from "react";
import { Download, ExternalLink, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function ImageModal({ imageUrl, onClose }) {
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleDownload = async () => {
        if (!imageUrl) return;
        setIsDownloading(true);
        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `chatify-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.success("Đã tải ảnh thành công");
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback: Mở tab mới để người dùng lưu ảnh thủ công nếu dính CORS
            window.open(imageUrl, "_blank");
            toast.success("Đã mở ảnh trong tab mới");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
            {/* Action Bar (Top Right) */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-4 right-4 flex items-center gap-2 z-50"
            >
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-all shadow-lg backdrop-blur-sm tooltip tooltip-bottom flex items-center justify-center"
                    data-tip="Tải ảnh về máy"
                >
                    {isDownloading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    ) : (
                        <Download className="w-5 h-5" />
                    )}
                </button>

                <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-all shadow-lg backdrop-blur-sm tooltip tooltip-bottom flex items-center justify-center"
                    data-tip="Mở tab mới"
                >
                    <ExternalLink className="w-5 h-5" />
                </a>

                <button
                    onClick={onClose}
                    className="p-2.5 rounded-full bg-slate-800/80 hover:bg-red-500/80 text-slate-200 hover:text-white transition-all shadow-lg backdrop-blur-sm tooltip tooltip-bottom flex items-center justify-center"
                    data-tip="Đóng (Esc)"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Main Image Container */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center animate-in zoom-in-95 duration-200"
            >
                <img
                    src={imageUrl}
                    alt="Enlarged view"
                    className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-700/50 select-none"
                />
            </div>
        </div>
    );
}

export default ImageModal;
