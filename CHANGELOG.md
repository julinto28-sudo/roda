# Changelog

## 1.1.0 - belum dirilis (tanggal diisi saat rilis)

### Ditambahkan
- Koreksi odometer terakhir. Tombol "Koreksi update terakhir" muncul saat ada minimal dua catatan odometer.
- Nilai koreksi harus lebih besar dari update sebelumnya, dan tidak boleh melewati catatan servis atau odometer servis terakhir part lain.
- Tanggal catatan odometer tidak berubah. Part yang odometer servis terakhirnya sama dengan nilai lama ikut dipindah ke nilai baru.
- Part yang masih menunggu servis pertama (odometer servis terakhir 0) tidak ikut dipindah saat koreksi odometer terakhir.

### Diubah
- Pesan penolakan koreksi menyebut catatan servis yang melewati nilai baru, dan cara memperbaikinya lewat tombol Edit di Riwayat.
- Versi aplikasi menjadi 1.1.0. Cache service worker menjadi roda-v44.

### Diperbaiki
- Pengingat notifikasi hanya dikirim untuk part yang sedang tampil. Part yang disembunyikan tidak lagi mengirim pengingat.
- Tanggal "Terakhir" pada part diambil dari riwayat servis yang sesuai.
- Preview server hanya melayani file yang diizinkan.
- app.js, index.html, dan vehicle-catalog.json memakai strategi network-first agar pembaruan lebih cepat terlihat.

### Diketahui
- Koreksi odometer terakhir memakai window.prompt dan window.alert, bukan dialog khusus.
- Fitur koreksi odometer terakhir belum diuji di browser.
