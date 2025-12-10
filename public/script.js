class DivisaPresentacion {
  constructor() {
    // Estado
    this.mediaFiles = [];
    this.currentMediaIndex = 0;
    this.isPlaying = true;

    // Auto-slide
    this.autoSlideInterval = null;
    this.autoSlideMs = 10000; // 10 segundos

    // Divisas
    this.lastValues = {};

    // Inicialización
    this.initElements();
    this.loadMedia();
    this.startDivisaUpdate();
    this.bindEvents();

    // Solo index.html tiene player
    if (this.mediaImg || this.mediaVideo) {
      this.startAutoSlide();
    }
  }

  // -------------------- Inicialización DOM --------------------

  initElements() {
    // Elementos de divisas (index.html)
    this.dolarValor    = document.getElementById('dolar-valor');
    this.dolarCambio   = document.getElementById('dolar-cambio');
    this.utmValor      = document.getElementById('utm-valor');
    this.utmCambio     = document.getElementById('utm-cambio');
    this.ufValor       = document.getElementById('uf-valor');
    this.ufCambio      = document.getElementById('uf-cambio');
    this.ultimaUpdate  = document.getElementById('ultima-update');

    // Player (index.html)
    this.mediaImg      = document.getElementById('media-img');
    this.mediaVideo    = document.getElementById('media-video');

    // CRUD (admin.html)
    this.mediaList     = document.getElementById('media-list');
    this.fileInput     = document.getElementById('file-input');
    this.uploadBtn     = document.getElementById('upload-btn');
  }

  bindEvents() {
    // Solo en admin.html existen estos elementos
    if (this.uploadBtn && this.fileInput) {
      this.uploadBtn.onclick = () => this.uploadFiles();
    }
  }

  // -------------------- Multimedia --------------------

  async loadMedia() {
    try {
      const response = await fetch('/api/media');
      this.mediaFiles = await response.json();

      // Si estoy en admin.html, pinto la lista
      if (this.mediaList) {
        this.updateMediaList();
      }

      // Si estoy en index.html, muestro el slide
      if ((this.mediaImg || this.mediaVideo) && this.mediaFiles.length > 0) {
        this.showMedia(0);
      }
    } catch (error) {
      console.error('Error cargando media:', error);
    }
  }

  updateMediaList() {
    if (!this.mediaList) return; // nada que hacer en index

    this.mediaList.innerHTML = '';
    this.mediaFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'media-item';
      item.innerHTML = `
        <span class="media-name">${file}</span>
        <button class="delete-btn" data-index="${index}">Eliminar</button>
      `;
      this.mediaList.appendChild(item);
    });

    // Enganchar botones de eliminar
    this.mediaList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.deleteMedia(idx);
      });
    });
  }

  async deleteMedia(index) {
    if (!this.mediaFiles || !this.mediaFiles[index]) return;
    const filename = this.mediaFiles[index];

    try {
      const resp = await fetch(`/api/media/${filename}`, { method: 'DELETE' });
      if (!resp.ok) {
        console.error('Error HTTP al eliminar:', resp.status);
        alert('Error al eliminar archivo.');
        return;
      }

      this.mediaFiles.splice(index, 1);
      this.updateMediaList();

      // Si estoy en index.html, ajusto el slide
      if ((this.mediaImg || this.mediaVideo) && this.mediaFiles.length > 0) {
        if (this.currentMediaIndex >= this.mediaFiles.length) {
          this.currentMediaIndex = 0;
        }
        this.showMedia(this.currentMediaIndex);
      }
    } catch (error) {
      console.error('Error eliminando:', error);
    }
  }

  showMedia(index) {
  if (!this.mediaFiles || this.mediaFiles.length === 0) {
    if (this.mediaImg)   this.mediaImg.style.display = 'none';
    if (this.mediaVideo) this.mediaVideo.style.display = 'none';
    return;
  }

  this.currentMediaIndex =
    ((index % this.mediaFiles.length) + this.mediaFiles.length) % this.mediaFiles.length;

  const file = this.mediaFiles[this.currentMediaIndex];
  const isVideo = /\.(mp4|webm|avi)$/i.test(file);

  // limpiar visibilidad previa
  if (this.mediaImg) {
    this.mediaImg.classList.remove('media-visible');
    this.mediaImg.style.display = 'none';
  }
  if (this.mediaVideo) {
    this.mediaVideo.classList.remove('media-visible');
    this.mediaVideo.style.display = 'none';
  }

  if (isVideo && this.mediaVideo) {
    this.mediaVideo.src = `/uploads/${file}`;
    this.mediaVideo.style.display = 'block';

    // forzar reflow para que la transición se aplique bien
    void this.mediaVideo.offsetWidth;
    this.mediaVideo.classList.add('media-visible');

    if (this.isPlaying) this.mediaVideo.play();
  } else if (this.mediaImg) {
    this.mediaImg.src = `/uploads/${file}`;
    this.mediaImg.style.display = 'block';

    void this.mediaImg.offsetWidth;
    this.mediaImg.classList.add('media-visible');
  }
}



  // Subida de archivos (solo admin.html)
  async uploadFiles(files = null) {
    if (!this.fileInput) return; // no hay panel admin

    const formData = new FormData();
    const toUpload = files ? files : Array.from(this.fileInput.files);

    if (toUpload.length === 0) {
      alert('Primero selecciona al menos un archivo.');
      return;
    }

    toUpload.forEach(file => formData.append('files', file));

    try {
      const resp = await fetch('/api/media', {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) {
        console.error('Error HTTP al subir:', resp.status);
        alert('Error al subir archivos.');
        return;
      }

      await this.loadMedia();  // recarga lista y carrusel
      this.fileInput.value = '';
    } catch (error) {
      console.error('Error subiendo:', error);
      alert('Error al subir archivos (revisa la consola).');
    }
  }

  // -------------------- Divisas + fecha/hora --------------------

  async updateDivisas() {
    try {
      const response = await fetch('https://mindicador.cl/api');
      const data = await response.json(); // data.dolar.valor, data.uf.valor, data.utm.valor [web:1]

      const indicadores = [
        { key: 'dolar', api: data.dolar },
        { key: 'uf',    api: data.uf },
        { key: 'utm',   api: data.utm }
      ];

      indicadores.forEach(({ key, api }) => {
        if (!api || typeof api.valor !== 'number') return;

        const valorNum = api.valor;
        const valorStr = valorNum.toLocaleString('es-CL', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });

        const elemValor  = document.getElementById(`${key}-valor`);
        const elemCambio = document.getElementById(`${key}-cambio`);

        if (!elemValor || !elemCambio) return;

        elemValor.textContent = `$${valorStr}`;

        if (this.lastValues[key] !== undefined) {
          const cambio = valorNum - this.lastValues[key];
          elemCambio.textContent = `${cambio > 0 ? '+' : ''}${cambio.toFixed(2)}`;
          elemCambio.style.color = cambio > 0 ? '#01E2A8' : '#ff5252';
        } else {
          elemCambio.textContent = 'N/A';
          elemCambio.style.color = '#ffffff';
        }

        this.lastValues[key] = valorNum;
      });
    } catch (error) {
      console.error('Error actualizando divisas:', error);
    }
  }

  updateFechaHora() {
    if (!this.ultimaUpdate) return;

    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const horaStr = ahora.toLocaleTimeString('es-CL');

    this.ultimaUpdate.textContent = `${fechaStr} - ${horaStr}`;
  }

  startDivisaUpdate() {
    // Puede que en admin.html no existan elementos de divisas; no pasa nada
    this.updateDivisas();
    setInterval(() => this.updateDivisas(), 30000);

    this.updateFechaHora();
    setInterval(() => this.updateFechaHora(), 1000);
  }
}

// Inicializar app
const presentacion = new DivisaPresentacion();