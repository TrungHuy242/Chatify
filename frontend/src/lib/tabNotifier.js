let blinkInterval = null;
let unreadCount = 0;
let lastSenderName = "";
const DEFAULT_TITLE = "Chatify";

export const initTabNotifier = () => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
        if (!document.hidden) {
            clearTabNotification();
        }
    };

    const handleFocus = () => {
        clearTabNotification();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
};

export const notifyNewMessage = ({ senderName = "Tin nhắn mới", playSound = true }) => {
    // 1. Phát chuông thông báo
    if (playSound) {
        try {
            const audio = new Audio("/sounds/notification.mp3");
            audio.currentTime = 0;
            audio.play().catch((err) => {
                // Ignore autoplay policy if not interacted yet
                console.log("Audio notification play error:", err);
            });
        } catch (e) {
            console.error("Audio error:", e);
        }
    }

    // 2. Nếu người dùng đang mở tab và đang tương tác thì không cần nhấp nháy tiêu đề
    if (!document.hidden && document.hasFocus()) {
        return;
    }

    // 3. Tăng bộ đếm tin chưa đọc khi ở tab khác
    unreadCount++;
    lastSenderName = senderName;

    if (blinkInterval) {
        clearInterval(blinkInterval);
    }

    let isShowingNotice = true;
    const noticeTitle = `🔔 (${unreadCount}) ${lastSenderName}: Tin nhắn mới!`;

    document.title = noticeTitle;

    blinkInterval = setInterval(() => {
        isShowingNotice = !isShowingNotice;
        document.title = isShowingNotice ? noticeTitle : `💬 ${DEFAULT_TITLE}`;
    }, 1200);
};

export const clearTabNotification = () => {
    if (blinkInterval) {
        clearInterval(blinkInterval);
        blinkInterval = null;
    }
    unreadCount = 0;
    lastSenderName = "";
    if (typeof document !== "undefined") {
        document.title = DEFAULT_TITLE;
    }
};
