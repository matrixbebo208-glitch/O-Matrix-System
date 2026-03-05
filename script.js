// O-Matrix-System | Serverless Intelligence Engine

// إعداد المحاولات عند أول دخول
if (!localStorage.getItem('matrix_trials')) {
    localStorage.setItem('matrix_trials', '5');
}

// تحديث العداد في الواجهة
const updateCounter = () => {
    const trials = localStorage.getItem('matrix_trials');
    document.getElementById('attempts-count').innerText = trials;
    
    // إذا انتهت المحاولات، نظهر خانة الـ ID ونغير لون العداد
    if (parseInt(trials) <= 0) {
        document.getElementById('trial-banner').style.borderColor = '#f85149';
        document.getElementById('trial-banner').style.color = '#f85149';
        document.getElementById('id-input-section').style.display = 'block';
        document.getElementById('process-btn').innerText = "تفعيل النسخة الكاملة للمتابعة";
    }
};

updateCounter();

let clickCount = 0;
const ADMIN_KEY = "01224815487";

// 1. منطق الضغطات الثلاث (Easter Egg)
function handleVersionClick() {
    clickCount++;
    setTimeout(() => { clickCount = 0; }, 2000); // تصفير العداد بعد ثانيتين

    if (clickCount === 3) {
        clickCount = 0;
        const pass = prompt("O-Matrix Access: أدخل رمز الإدارة");
        if (pass === ADMIN_KEY) {
            document.getElementById('admin-modal').style.display = 'flex';
        } else {
            alert("صلاحية مرفوضة!");
        }
    }
}

function closeAdminModal() {
    document.getElementById('admin-modal').style.display = 'none';
}

// 2. تفعيل ID المشترك
function confirmActivation() {
    const newId = document.getElementById('admin-target-id').value;
    if (!newId) return alert("أدخل ID أولاً");

    // حفظ الـ ID في "قائمة المفعلين" (محلياً للمتصفح الحالي)
    localStorage.setItem('active_license', newId);
    alert("تم تفعيل الـ ID بنجاح على هذا الجهاز.");
    location.reload(); // إعادة تحميل لتحديث الحالة
}

// 3. المحرك الرئيسي لمعالجة الملفات
function startProcessing() {
    const trials = parseInt(localStorage.getItem('matrix_trials'));
    const license = localStorage.getItem('active_license');
    const prefix = document.getElementById('phone-prefix').value;

    // حالة 1: وجود اشتراك مفعل
    if (license) {
        processLogic(prefix, "اشتراك مدفوع");
        return;
    }

    // حالة 2: استخدام المحاولات المجانية
    if (trials > 0) {
        const nextTrials = trials - 1;
        localStorage.setItem('matrix_trials', nextTrials.toString());
        updateCounter();
        processLogic(prefix, `تجربة مجانية (متبقي ${nextTrials})`);
    } else {
        // حالة 3: انتهاء المحاولات
        const userIdInput = document.getElementById('user-id-input').value;
        if (!userIdInput) {
            alert("انتهت محاولاتك! تواصل مع الأدمن للحصول على ID التفعيل بـ 50ج.");
            window.open(`https://wa.me/201224815487?text=أريد شراء ID تفعيل لسيستم O-Matrix`, "_blank");
        } else {
            alert("هذا الـ ID غير مسجل في قاعدة البيانات الحالية.");
        }
    }
}

// 4. منطق التصنيف الفعلي (محاكاة)
function processLogic(prefix, status) {
    if (!prefix) return alert("برجاء إدخال كود الدولة أولاً (مثلاً +20)");
    
    alert(`جاري معالجة الملفات بنظام ${status}...`);
    
    // محاكاة فتح الواتساب يدوياً
    setTimeout(() => {
        const whatsappMsg = encodeURIComponent(`تم استخراج وتصنيف البيانات بنجاح بكود: ${prefix}`);
        window.open(`https://wa.me/?text=${whatsappMsg}`, "_blank");
    }, 1500);
}

// التعامل مع رفع الملفات (Drag & Drop)
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('fileInput');

dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => handleFiles(e.target.files);

dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = "#25d366"; };
dropZone.ondragleave = () => { dropZone.style.borderColor = "#30363d"; };
dropZone.ondrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
};

function handleFiles(files) {
    if (files.length > 0) {
        document.getElementById('upload-text').innerText = `تم اختيار ${files.length} ملفات`;
        document.getElementById('file-list').innerText = Array.from(files).map(f => f.name).join(', ');
    }
}
