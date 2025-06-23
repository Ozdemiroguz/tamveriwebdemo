# 🛠️ Tam Veri Demo Web Entegrasyon Rehberi (Web Kontrol Paneli)

> **Dikkat:**
> Bu projede `js/firebase-config.js` dosyası gizli tutulur ve repoya eklenmez. Kendi Firebase config’inizi `js/firebase-config.example.js` dosyasını kopyalayıp doldurarak `js/firebase-config.js` olarak ekleyin.

Bu rehber, HTML, CSS ve JS kullanılarak geliştirilecek olan ortak web panelinin yapısını açıklar. Rehberde güvenlik, tutarlılık ve iki yönlü erişim yapısı ön planda tutulur.

🎯 Amaç

Aşağıdaki iki erişim yöntemiyle aynı şekilde çalışan tek bir web panel arayüzü oluşturmak:

* Web üzerinden giriş (Firebase Login ile)
* Mobil uygulama üzerinden erişim (appKey + uid ile)

Amaç, erişim yöntemi fark etmeksizin aynı görsel ve işlevsel deneyimi sağlamak ve özellikle web tarafında uid ya da token gibi hassas bilgileri hiçbir şekilde göstermemektir.

🔐 Erişim Yöntemleri

1. Web Girişi (Standart)

* Kullanıcı Firebase Auth ile giriş yapar.
* Girişten sonra Firebase üzerinden uid alınır.
* Kullanıcının workplaceId ve rol bilgisine göre UI oluşturulur.

2. Mobil Dashboard Erişimi (AppKey ile)

* Mobil uygulama, WebView üzerinden paneli açar.
* Uygulama URL'e iki parametre ile yönlendirir:

  * uid (Firebase'den alınan kullanıcı kimliği)
  * appKey (Firebase'de tanımlı sabit güvenli anahtar)
* Örnek URL formatı:

  * [https://dashboard.companydomain.com?uid=UID\_VALUE\&appKey=SECURE\_KEY](https://dashboard.companydomain.com?uid=UID_VALUE&appKey=SECURE_KEY)

🧱 Firebase Veri Yapısı

🔹 Koleksiyon: users
{
"role": "worker",
"workplaceId": "w1",
"isApproved": true
}

🔹 Koleksiyon: workplaces
{
"name": "Fabrika A",
"adminId": "adminUID"
}

🔸 Alt Koleksiyon: machines
{
"name": "Makine 1",
"assignedUserIds": \["userUID1"],
"status": "active"
}

🔍 Model Tanımları (Veri Modelleri)

📌 MachineModel

```
@freezed
class MachineModel with _$MachineModel {
  const factory MachineModel({
    required String id,
    required String name,
    required String description,
    required String status, // 'active', 'stopped', 'error', 'maintenance'
    String? imageUrl,
    String? tips,
    required List<String> assignedUserIds,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() DateTime? updatedAt,
  }) = _MachineModel;

  factory MachineModel.fromJson(Map<String, dynamic> json) =>
      _$MachineModelFromJson(json);
}
```

📌 UserModel

```
@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    required String fullName,
    required String email,
    required String role,
    required String workplaceId,
    required bool isApproved,
    String? pin,
    String? profilePhoto,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() DateTime? lastLoginAt,
    WorkplaceModel? workplace,
  }) = _UserModel;
}
```

📌 WorkplaceModel

```
class WorkplaceModel {
  final String id;
  final String name;
  final String location;
  final String? logoUrl;
  final String adminId;
  final List<String> approvedUserIds;
  final DateTime createdAt;

  const WorkplaceModel({
    required this.id,
    required this.name,
    required this.location,
    this.logoUrl,
    required this.adminId,
    this.approvedUserIds = const [],
    required this.createdAt,
  });
}
```

🔁 Mobil Dashboard Erişim Akışı (AppKey ile)

1. URL'den uid ve appKey parametreleri alınır.
2. appKey, Firebase Hosting config ya da Functions üzerinden doğrulanır.
3. /users/{uid} yolu üzerinden kullanıcı verisi çekilir.
4. isApproved kontrol edilir (true değilse durdurulur).
5. workplaceId alınarak ilgili workplace ve makineler çekilir.
6. Sadece assignedUserIds içerisinde uid olan makineler filtrelenir.
7. UI buna göre oluşturulur.

⚠️ Güvenlik Notları

* uid frontend'de gösterilmez.
* appKey doğrulanmadan hiçbir işlem yapılmaz.
* Sadece onaylı (isApproved: true) kullanıcılar giriş yapabilir.
* appKey sadece mobil erişim için geçerlidir.
* Web erişimlerinde bu key kullanılmaz.

🖥 Arayüz Beklentileri

* Web ve mobilde aynı tasarım kullanılacak.
* Makine listesi ve durum bilgileri gösterilecek.
* Her makineye özel rapor listesi (eğer açık ise)
* Rol bazlı yetkiler:

  * Admin: Tüm verilere ve kullanıcı atamalarına tam erişim
  * Worker: Sadece atanmış makineleri görme yetkisi

📄 Sayfa Tanıtımları

1. Giriş Sayfası (Login Page)

* Giriş sadece e-posta ve şifre ile Firebase Auth üzerinden yapılır.
* Tema: Turuncu - Beyaz

  * Arka plan beyaz
  * Giriş butonları ve vurgu alanları turuncu
  * Üstte yer alacak sade logo alanı (örnek: "AseLere")
* Minimal tasarım: Logo, giriş formu, hata mesajı, "Giriş Yap" butonu
* Giriş başarılıysa kullanıcı dashboard ekranına yönlendirilir.

2. Dashboard Sayfası

* Tema: Yeşil, Kırmızı ve Beyaz

  * Yeşil: Aktif makineler
  * Kırmızı: Hatalı/duran makineler
  * Beyaz: Genel arka plan ve kartlar
* Giriş yapan kullanıcının rolüne göre ekran filtrelenir

  * Admin: Tüm makineler ve kullanıcı listeleri
  * Worker: Sadece atanmış makineler
* Makinelerin listesi, durum ikonları, ve kullanıcıya atanmışlık bilgisi gösterilir
* Her makineye tıklandığında detay ekranı açılır
* Gerçek zamanlı dinleme ile anlık güncellemeler yansıtılır

🔄 Gerçek Zamanlı Veri (Opsiyonel Geliştirme)

Firestore onSnapshot kullanarak anlık güncellemeler alınabilir:

* /machines: durum değişiklikleri
* /reports: yeni raporlar
* /logs: hızlı işlem kayıtları

Örnek: Makine durumu dinleme

firebase.firestore()
.collection('workplaces')
.doc(workplaceId)
.collection('machines')
.onSnapshot(snapshot => {
snapshot.docChanges().forEach(change => {
if (change.type === 'modified') {
const updatedMachine = change.doc.data();
updateMachineUI(updatedMachine);
}
});
});

📦 Panelin Render Edilmesi İçin Gerekli Veriler

* Kullanıcı verisi alınırken:

  * workplaceId, role, isApproved
* Workplace verisi alınırken:

  * name, logoUrl, location
* Sonrasında:

  * workplaceId ile /machines alt koleksiyonu çekilir.
  * Kullanıcının uid'si, makinedeki assignedUserIds içinde ise UI'da gösterilir.
  * onSnapshot ile makinelerdeki anlık değişiklikler UI'a yansıtılır.

🌐 Dil Desteği

Desteklenen diller: Türkçe (TR), İngilizce (EN), Bulgarca (BG)

* Statik JSON dosyaları ya da Firebase üzerinden tarayıcı diline göre yüklenebilir.

🔚 Özet

Bu sistem sayesinde platformdan bağımsız, güvenli ve tutarlı bir panel sağlanır:

* Veri sızıntıları önlenir
* Ortak bir UI kullanılır
* Roller net biçimde ayrılır ve filtreli erişim sağlanır
* Minimum ama yeterli veri ile işlem yapılır
* Gerçek zamanlı güncellemeler desteklenir
* İleri geliştirmeler (analitik, çok dilli destek vb.) bu temel yapı korunarak kolayca eklenebilir.
