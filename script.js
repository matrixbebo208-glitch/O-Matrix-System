// O-System | Logic & Administration Client-side

let clickCount = 0;

// 1. وظيفة تتبع الضغطات الثلاث لفتح لوحة الأدمن الخفية
function handleVersionClick() {
    clickCount++;
    
    // إعادة تصفير العداد لو الضغطات كانت بطيئة جداً (أكثر من 2 ثانية)
    setTimeout(() => { clickCount = 0; }, 2000);

    if (clickCount === 3) {
        clickCount = 0;
        const password = prompt("نظام O-System: برجاء إدخال رمز الوصول الإداري:");
        
        if (password === "01224815487") {
            document.getElementById('admin-modal').style.display = 'flex';
        } else if (password !== null) {
            alert("عذراً، الرمز غير صحيح. لا تملك صلاحية الوصول.");
        }
    }
}

// 2. إغلاق لوحة الأدمن
function closeAdminModal() {
    document.getElementById('admin-modal').style.display = 'none';
}

// 3. تفعيل الاشتراك من لوحة الأدمن (يرسل البيانات للـ app.py)
function confirmActivation() {
    const targetId = document.getElementById('admin-target-id').value;
    const plan = document.getElementById('admin-plan').value;

    if (!targetId) {
        alert("برجاء إدخال ID المشترك أولاً");
        return;
    }

    const formData = new FormData();
    formData.append('password', '01224815487'); // الباسورد المطلوب للتفعيل
    formData.append('target_id', targetId);
    formData.append('plan', plan);

    fetch('/admin/activate', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert(data.msg);
            closeAdminModal();
        } else {
            alert(data.msg);
        }
    });
}

// 4. منطق معالجة الملفات والتحقق من المحاولات الـ 5
function startProcessing() {
    const prefix = document.getElementById('phone-prefix').value;
    const folder = document.getElementById('folder-name').value;
    
    // في حالة التجربة، نرسل طلباً للسيرفر لخصم محاولة
    const formData = new FormData();
    // يمكنك إضافة ID المستخدم هنا لو كان مسجلاً دخول
    
    fetch('/process', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'trial') {
            document.getElementById('attempts-count').innerText = data.remaining;
            alert("تمت المعالجة بنجاح! متبقي لك " + data.remaining + " محاولات مجانية.");
            // هنا تضع كود فتح الواتساب اليدوي
            openWhatsApp(prefix);
        } else if (data.status === 'limit') {
            alert(data.msg);
            // توجيه المستخدم للواتساب الخاص بك للاشتراك
            window.open("https://wa.me/201224815487?text=أريد تفعيل اشتراك O-System", "_blank");
        } else if (data.status === 'success') {
            alert(data.msg);
            openWhatsApp(prefix);
        }
    });
}

// 5. وظيفة فتح الواتساب يدوياً (WhatsApp Link Generator)
function openWhatsApp(prefix) {
    if (prefix) {
        const msg = encodeURIComponent("مرحباً، تم تصنيف الملفات بناءً على الكود: " + prefix);
        // هذا مجرد مثال، يمكنك تعديله ليفتح رقم العميل المكتشف
        console.log("تجهيز رابط الواتساب...");
    }
}

// 6. التعامل مع Drag & Drop في الواجهة
const dropZone = document.getElementById('drop-zone');
dropZone.onclick = () => document.getElementById('fileInput').click();

dropZone.ondragover = (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "#25d366";
};

dropZone.ondragleave = () => {
    dropZone.style.borderColor = "#475569";
};

dropZone.ondrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    alert("تم استقبال " + files.length + " ملفات. جاهز للمعالجة.");
};
