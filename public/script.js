class DivisaPresentacion {
  constructor() {
    // Estado
    this.mediaFiles = [];
    this.currentMediaIndex = 0;
    this.isPlaying = true;

    // Auto-slide
    this.autoSlideInterval = null;
    this.autoSlideMs = 10000; // 10 segundos
    this.autoSlideTimer = null; // timer para avanzar por imagen

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
    this.cancelBtn     = document.getElementById('cancel-btn');
    this.uploadZone    = document.getElementById('upload-zone');
    this.progressContainer = document.getElementById('progress-container');
    this.progressFill  = document.getElementById('progress-fill');
    this.progressText  = document.getElementById('progress-text');
    this.progressPercent = document.getElementById('progress-percent');
    this.validationMsg = document.getElementById('validation-message');
    this.fileSelectedContainer = document.getElementById('file-selected-container');
    this.selectedFiles = document.getElementById('selected-files');
    this.previewContainer = document.getElementById('preview-container');
    this.fileCount     = document.getElementById('file-count');
    this.lastUpdate    = document.getElementById('last-update');
    this.emptyState    = document.getElementById('empty-state');

    // Validación
    this.ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/x-msvideo'];
    this.selectedFilesList = []; // guardar archivos seleccionados
  }

  bindEvents() {
    // Fullscreen personalizado (index.html)
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    }

    // Admin panel (admin.html)
    if (this.uploadZone && this.fileInput) {
      this.uploadZone.addEventListener('click', () => this.fileInput.click());
      this.uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
      this.uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      this.uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
    }

    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    if (this.uploadBtn) {
      this.uploadBtn.addEventListener('click', () => this.uploadFiles());
    }

    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.cancelUpload());
    }
  }

  // ===== MANEJO DE ARCHIVOS (DRAG & DROP) =====
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.uploadZone) {
      this.uploadZone.classList.add('dragover');
    }
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.uploadZone) {
      this.uploadZone.classList.remove('dragover');
    }
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.uploadZone) {
      this.uploadZone.classList.remove('dragover');
    }
    
    const files = e.dataTransfer.files;
    this.processFiles(files);
  }

  handleFileSelect(e) {
    const files = e.target.files;
    this.processFiles(files);
  }

  processFiles(files) {
    this.selectedFilesList = [];
    const errors = [];

    Array.from(files).forEach((file, index) => {
      const validation = this.validateFile(file);
      if (validation.valid) {
        this.selectedFilesList.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      this.showValidationMessage(errors.join(' | '), 'error');
    } else if (this.selectedFilesList.length > 0) {
      this.showValidationMessage(`✓ ${this.selectedFilesList.length} archivo(s) seleccionado(s)`, 'success');
    }

    this.updateFilePreview();
  }

  validateFile(file) {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Tipo de archivo no permitido' };
    }
    return { valid: true };
  }

  updateFilePreview() {
    if (this.selectedFilesList.length === 0) {
      this.fileSelectedContainer.style.display = 'none';
      return;
    }

    this.fileSelectedContainer.style.display = 'block';
    this.selectedFiles.innerHTML = '';
    this.previewContainer.innerHTML = '';

    this.selectedFilesList.forEach((file, index) => {
      // Mostrar nombre y tamaño
      const fileDiv = document.createElement('div');
      fileDiv.className = 'selected-file';
      fileDiv.innerHTML = `
        <span class="selected-file-name">${file.name}</span>
        <span class="selected-file-size">${this.formatFileSize(file.size)}</span>
        <button class="selected-file-remove" onclick="presentacion.removeFile(${index})">✕</button>
      `;
      this.selectedFiles.appendChild(fileDiv);

      // Preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewDiv = document.createElement('div');
          previewDiv.className = 'preview-item';
          previewDiv.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
          this.previewContainer.appendChild(previewDiv);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  removeFile(index) {
    this.selectedFilesList.splice(index, 1);
    this.updateFilePreview();
    if (this.selectedFilesList.length === 0) {
      this.validationMsg.style.display = 'none';
    }
  }

  cancelUpload() {
    this.selectedFilesList = [];
    if (this.fileInput) this.fileInput.value = '';
    this.fileSelectedContainer.style.display = 'none';
    this.validationMsg.style.display = 'none';
    this.progressContainer.style.display = 'none';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  showValidationMessage(message, type) {
    if (!this.validationMsg) return;
    this.validationMsg.className = `validation-message ${type}`;
    this.validationMsg.textContent = message;
    this.validationMsg.style.display = 'flex';
  }

  async uploadFiles(files = null) {
    if (this.selectedFilesList.length === 0) {
      if (!this.fileInput) return;
      this.showValidationMessage('⚠️ Selecciona al menos un archivo', 'warning');
      return;
    }

    this.progressContainer.style.display = 'block';
    this.uploadBtn.disabled = true;

    const formData = new FormData();
    this.selectedFilesList.forEach(file => formData.append('files', file));

    try {
      const xhr = new XMLHttpRequest();

      // Mostrar progreso
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          this.progressFill.style.width = percent + '%';
          this.progressPercent.textContent = percent + '%';
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          this.showValidationMessage('✓ Archivos subidos exitosamente', 'success');
          this.selectedFilesList = [];
          this.cancelUpload();
          await this.loadMedia();
        } else {
          this.showValidationMessage('✗ Error al subir archivos', 'error');
        }
        this.uploadBtn.disabled = false;
      });

      xhr.addEventListener('error', () => {
        this.showValidationMessage('✗ Error de conexión', 'error');
        this.uploadBtn.disabled = false;
      });

      xhr.open('POST', '/api/media');
      xhr.send(formData);
    } catch (error) {
      console.error('Error subiendo:', error);
      this.showValidationMessage('✗ Error al subir archivos', 'error');
      this.uploadBtn.disabled = false;
    }
  }

  toggleFullscreen() {
    const layout = document.getElementById('presentacion-layout');
    if (!layout) return;

    if (!document.fullscreenElement) {
      // Entrar en fullscreen
      if (layout.requestFullscreen) {
        layout.requestFullscreen().catch(err => {
          console.error(`Error al entrar en fullscreen: ${err.message}`);
        });
      } else if (layout.webkitRequestFullscreen) {
        layout.webkitRequestFullscreen();
      } else if (layout.msRequestFullscreen) {
        layout.msRequestFullscreen();
      }
    } else {
      // Salir de fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.error(`Error al salir de fullscreen: ${err.message}`);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
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
      const isVideo = /\.(mp4|webm|avi)$/i.test(file);
      const fileType = isVideo ? 'VIDEO' : 'IMAGEN';
      
      const item = document.createElement('div');
      item.className = 'media-item';
      item.innerHTML = `
        <span class="media-name">${file}</span>
        <span class="media-type">${fileType}</span>
        <button class="delete-btn" data-index="${index}">Eliminar</button>
      `;
      this.mediaList.appendChild(item);
    });

    // Actualizar estado
    if (this.fileCount) {
      this.fileCount.textContent = this.mediaFiles.length;
    }
    if (this.emptyState) {
      this.emptyState.style.display = this.mediaFiles.length === 0 ? 'block' : 'none';
    }

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
    this.mediaVideo.onended = null;
  }

  if (isVideo && this.mediaVideo) {
    this.mediaVideo.src = `/uploads/${file}`;
    this.mediaVideo.style.display = 'block';

    // forzar reflow para que la transición se aplique bien
    void this.mediaVideo.offsetWidth;
    this.mediaVideo.classList.add('media-visible');

      if (this.isPlaying) this.mediaVideo.play();

      // Al terminar, pasar al siguiente medio (loop en la lista)
      this.mediaVideo.onended = () => {
        this.nextMedia();
      };
  } else if (this.mediaImg) {
    this.mediaImg.src = `/uploads/${file}`;
    this.mediaImg.style.display = 'block';

    void this.mediaImg.offsetWidth;
    this.mediaImg.classList.add('media-visible');
    // Para imágenes, avanzar automáticamente después de `autoSlideMs`
    this.clearAutoAdvance();
    this.autoSlideTimer = setTimeout(() => this.nextMedia(), this.autoSlideMs);
  }
}

  // Avanza al siguiente medio y mantiene looping
  nextMedia() {
    this.clearAutoAdvance();
    if (!this.mediaFiles || this.mediaFiles.length === 0) return;
    const nextIndex = (this.currentMediaIndex + 1) % this.mediaFiles.length;
    this.showMedia(nextIndex);
  }

  clearAutoAdvance() {
    if (this.autoSlideTimer) {
      clearTimeout(this.autoSlideTimer);
      this.autoSlideTimer = null;
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
    if (!this.ultimaUpdate && !this.lastUpdate) return;

    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const horaStr = ahora.toLocaleTimeString('es-CL');

    const timeString = `${fechaStr} - ${horaStr}`;
    
    if (this.ultimaUpdate) {
      this.ultimaUpdate.textContent = timeString;
    }
    
    if (this.lastUpdate) {
      this.lastUpdate.textContent = timeString;
    }
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