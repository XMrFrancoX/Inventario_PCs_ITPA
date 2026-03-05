/**
 * modal.js — Modal de ficha técnica de laptop
 */
const Modal = (() => {
  let currentSlot = null;
  let editMode = false;

  async function open(shelf, index) {
    const slot = await DataStore.getSlot(shelf, index);
    if (!slot) return;
    currentSlot = { shelf, index };
    editMode = false;

    renderModal(slot);
    document.getElementById('laptopModal').classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('laptopModal').classList.remove('visible');
    document.body.style.overflow = '';
    currentSlot = null;
    editMode = false;
  }

  function renderModal(slot) {
    const modal = document.getElementById('laptopModalContent');
    const statusOptions = [
      { value: 'vacio', label: 'Vacío (Sin asignar)', color: 'gray' },
      { value: 'almacenada', label: 'Almacenada (Disponible)', color: 'green' },
      { value: 'enuso', label: 'En uso', color: 'red' },
      { value: 'excepcion', label: 'Excepción', color: 'yellow' },
      { value: 'staff', label: 'Uso Staff', color: 'blue' }
    ];

    const title = slot.laptopId || `Ranura ${slot.slotIndex}`;
    const shelfLabel = DataStore.getShelfLabel(slot.shelf);

    document.getElementById('modalTitle').innerHTML = `
      <span class="status-badge status-badge--${slot.status}">${statusLabel(slot.status)}</span>
      ${title} — ${shelfLabel}
    `;

    modal.innerHTML = `
      <!-- Mode switch -->
      <div class="switch-wrapper" style="margin-bottom: 20px;">
        <label class="switch">
          <input type="checkbox" id="editModeSwitch" ${editMode ? 'checked' : ''}>
          <span class="switch__slider"></span>
        </label>
        <span class="switch-label">Modo Edición</span>
      </div>

      <!-- Identificación -->
      <div class="form-section">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h4"/>
        </svg>
        Identificación
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ID de Laptop</label>
          <input class="form-input" id="fld_laptopId" value="${esc(slot.laptopId)}" ${dis()}>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-select" id="fld_status" ${dis()}>
            ${statusOptions.map(o => `<option value="${o.value}" ${slot.status === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Asignación -->
      <div class="form-section">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        Asignación Actual
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Responsable actual</label>
          <input class="form-input" id="fld_responsable" value="${esc(slot.responsable)}" ${dis()}>
        </div>
        <div class="form-group">
          <label class="form-label">Curso / División</label>
          <input class="form-input" id="fld_curso" value="${esc(slot.curso)}" ${dis()}>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Hora de entrega</label>
          <input class="form-input" type="time" id="fld_hora" value="${esc(slot.hora)}" ${dis()}>
        </div>
        <div class="form-group">
          <label class="form-label">Entregado por</label>
          <input class="form-input" id="fld_entregadoPor" value="${esc(slot.entregadoPor)}" ${dis()} readonly>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Ubicación</label>
        <input class="form-input" id="fld_ubicacion" value="${esc(slot.ubicacion)}" placeholder="Ej: Preceptoría, Laboratorio 1, Sistemas..." ${dis()}>
      </div>

      <!-- Datos del equipo -->
      <div class="form-section">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
        Datos del Equipo
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Marca</label>
          <input class="form-input" id="fld_marca" value="${esc(slot.marca)}" ${dis()}>
        </div>
        <div class="form-group">
          <label class="form-label">Modelo</label>
          <input class="form-input" id="fld_modelo" value="${esc(slot.modelo)}" ${dis()}>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nro. Serie</label>
          <input class="form-input" id="fld_serie" value="${esc(slot.serie)}" ${dis()}>
        </div>
        <div class="form-group">
          <label class="form-label">Dirección MAC</label>
          <input class="form-input" id="fld_mac" value="${esc(slot.mac)}" ${dis()}>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">IP Estática</label>
          <input class="form-input" id="fld_ip" value="${esc(slot.ip)}" ${dis()}>
        </div>
        <div class="form-group">
          <label class="form-label">Admin Local</label>
          <input class="form-input" id="fld_adminLocal" value="${esc(slot.adminLocal)}" ${dis()}>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">BIOS Password</label>
        <input class="form-input" type="password" id="fld_biosPass" value="${esc(slot.biosPass)}" ${dis()}>
      </div>

      <!-- Hardware -->
      <div class="form-section">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2"/>
        </svg>
        Hardware
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Procesador (CPU)</label>
          <input class="form-input" id="fld_cpu" value="${esc(slot.cpu)}" ${dis()}>
        </div>
        <div class="form-group">
          <label class="form-label">Memoria RAM</label>
          <input class="form-input" id="fld_ram" value="${esc(slot.ram)}" ${dis()}>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Almacenamiento</label>
        <input class="form-input" id="fld_storage" value="${esc(slot.storage)}" ${dis()}>
      </div>

      <!-- Software -->
      <div class="form-section">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        Software Instalado
      </div>
      <div class="checkbox-grid">
        ${renderCheckbox('sw_windows', 'Windows', slot.software?.windows)}
        ${renderCheckbox('sw_office', 'Office', slot.software?.office)}
        ${renderCheckbox('sw_autocad', 'AutoCAD', slot.software?.autocad)}
        ${renderCheckbox('sw_solidworks', 'SolidWorks', slot.software?.solidworks)}
        ${renderCheckbox('sw_vscode', 'VS Code', slot.software?.vscode)}
        ${renderCheckbox('sw_arduino', 'Arduino IDE', slot.software?.arduino)}
      </div>

      <!-- Mantenimiento -->
      <div class="form-section">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
        Checks de Mantenimiento
      </div>
      <div class="checkbox-grid">
        ${renderCheckbox('mt_limpiezaInterna', 'Limpieza Interna', slot.mantenimiento?.limpiezaInterna)}
        ${renderCheckbox('mt_limpiezaExterna', 'Limpieza Externa', slot.mantenimiento?.limpiezaExterna)}
        ${renderCheckbox('mt_actualizacionSO', 'Actualización SO', slot.mantenimiento?.actualizacionSO)}
        ${renderCheckbox('mt_actualizacionDrivers', 'Actualización Drivers', slot.mantenimiento?.actualizacionDrivers)}
        ${renderCheckbox('mt_revisionBateria', 'Revisión Batería', slot.mantenimiento?.revisionBateria)}
        ${renderCheckbox('mt_revisionCargador', 'Revisión Cargador', slot.mantenimiento?.revisionCargador)}
        ${renderCheckbox('mt_revisionPantalla', 'Revisión Pantalla', slot.mantenimiento?.revisionPantalla)}
        ${renderCheckbox('mt_revisionTeclado', 'Revisión Teclado', slot.mantenimiento?.revisionTeclado)}
      </div>

      <!-- Observaciones -->
      <div class="form-section">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Observaciones
      </div>
      <div class="form-group">
        <textarea class="form-input" id="fld_observaciones" rows="3" ${dis()}>${esc(slot.observaciones)}</textarea>
      </div>
    `;

    // Edit mode switch listener
    document.getElementById('editModeSwitch').addEventListener('change', (e) => {
      editMode = e.target.checked;
      toggleFields(editMode);
      updateFooterButtons();
      if (editMode) {
        attachStatusChangeListener();
      }
    });

    if (editMode) {
      attachStatusChangeListener();
    }

    updateFooterButtons();
  }

  function renderCheckbox(id, label, checked) {
    return `
      <label class="checkbox-item ${editMode ? '' : 'disabled'}">
        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} ${editMode ? '' : 'disabled'}>
        ${label}
      </label>
    `;
  }

  function toggleFields(enabled) {
    const modal = document.getElementById('laptopModalContent');
    modal.querySelectorAll('.form-input, .form-select').forEach(el => {
      if (el.id === 'fld_entregadoPor') {
        el.readOnly = true;
        el.disabled = !enabled;
        return;
      }
      el.disabled = !enabled;
    });
    modal.querySelectorAll('.checkbox-item').forEach(el => {
      el.classList.toggle('disabled', !enabled);
      el.querySelector('input[type="checkbox"]').disabled = !enabled;
    });
  }

  /** Auto-fill hora and entregadoPor when status changes, clear assignment on almacenada/vacio */
  function attachStatusChangeListener() {
    const statusEl = document.getElementById('fld_status');
    if (!statusEl) return;
    statusEl.addEventListener('change', () => {
      const newStatus = statusEl.value;
      const horaEl = document.getElementById('fld_hora');
      const entregadoEl = document.getElementById('fld_entregadoPor');
      const responsableEl = document.getElementById('fld_responsable');
      const cursoEl = document.getElementById('fld_curso');
      const ubicacionEl = document.getElementById('fld_ubicacion');

      if (newStatus === 'almacenada' || newStatus === 'vacio') {
        // Clear all assignment fields
        if (responsableEl) responsableEl.value = '';
        if (cursoEl) cursoEl.value = '';
        if (horaEl) horaEl.value = '';
        if (entregadoEl) entregadoEl.value = '';
        if (ubicacionEl) ubicacionEl.value = '';
      } else {
        // Auto-fill hora and entregadoPor for enuso/staff/excepcion
        const now = new Date();
        const horaArg = now.toLocaleTimeString('es-AR', {
          timeZone: 'America/Argentina/Buenos_Aires',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        if (horaEl) horaEl.value = horaArg;
        const user = Auth.getUser();
        if (entregadoEl && user) entregadoEl.value = user.fullName;
      }
    });
  }

  function updateFooterButtons() {
    const footer = document.getElementById('modalFooter');
    if (editMode) {
      footer.innerHTML = `
        <button class="btn btn--secondary" id="modalCancelBtn">Cancelar</button>
        <button class="btn btn--success" id="modalSaveBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Guardar Cambios
        </button>
      `;
      document.getElementById('modalCancelBtn').addEventListener('click', async () => {
        editMode = false;
        const slot = await DataStore.getSlot(currentSlot.shelf, currentSlot.index);
        renderModal(slot);
      });
      document.getElementById('modalSaveBtn').addEventListener('click', saveSlot);
    } else {
      footer.innerHTML = `
        <button class="btn btn--secondary" id="modalCloseBtn2">Cerrar</button>
      `;
      document.getElementById('modalCloseBtn2').addEventListener('click', close);
    }
  }

  async function saveSlot() {
    if (!currentSlot) return;

    // Get the old slot data to detect status change
    const oldSlot = await DataStore.getSlot(currentSlot.shelf, currentSlot.index);

    const user = Auth.getUser();
    const fields = {
      laptopId: document.getElementById('fld_laptopId').value.trim(),
      status: document.getElementById('fld_status').value,
      responsable: document.getElementById('fld_responsable').value.trim(),
      curso: document.getElementById('fld_curso').value.trim(),
      hora: document.getElementById('fld_hora').value,
      entregadoPor: user ? user.fullName : document.getElementById('fld_entregadoPor').value.trim(),
      ubicacion: document.getElementById('fld_ubicacion').value.trim(),
      marca: document.getElementById('fld_marca').value.trim(),
      modelo: document.getElementById('fld_modelo').value.trim(),
      serie: document.getElementById('fld_serie').value.trim(),
      mac: document.getElementById('fld_mac').value.trim(),
      ip: document.getElementById('fld_ip').value.trim(),
      adminLocal: document.getElementById('fld_adminLocal').value.trim(),
      biosPass: document.getElementById('fld_biosPass').value,
      cpu: document.getElementById('fld_cpu').value.trim(),
      ram: document.getElementById('fld_ram').value.trim(),
      storage: document.getElementById('fld_storage').value.trim(),
      observaciones: document.getElementById('fld_observaciones').value.trim(),
      software: {
        windows: document.getElementById('sw_windows').checked,
        office: document.getElementById('sw_office').checked,
        autocad: document.getElementById('sw_autocad').checked,
        solidworks: document.getElementById('sw_solidworks').checked,
        vscode: document.getElementById('sw_vscode').checked,
        arduino: document.getElementById('sw_arduino').checked,
      },
      mantenimiento: {
        limpiezaInterna: document.getElementById('mt_limpiezaInterna').checked,
        limpiezaExterna: document.getElementById('mt_limpiezaExterna').checked,
        actualizacionSO: document.getElementById('mt_actualizacionSO').checked,
        actualizacionDrivers: document.getElementById('mt_actualizacionDrivers').checked,
        revisionBateria: document.getElementById('mt_revisionBateria').checked,
        revisionCargador: document.getElementById('mt_revisionCargador').checked,
        revisionPantalla: document.getElementById('mt_revisionPantalla').checked,
        revisionTeclado: document.getElementById('mt_revisionTeclado').checked,
      }
    };

    if (user && fields.status === 'enuso') {
      fields.entregadoPor = user.fullName;
    }

    await DataStore.updateSlot(currentSlot.shelf, currentSlot.index, fields);

    // Record transaction if status changed
    if (oldSlot && oldSlot.status !== fields.status && fields.status !== 'vacio') {
      const tipoMap = { almacenada: 'retorno', enuso: 'clase', staff: 'staff', excepcion: 'excepcion' };
      const txnTipo = tipoMap[fields.status] || fields.status;
      const laptopLabel = fields.laptopId || `R${currentSlot.index}`;

      await DataStore.addTransaction({
        tipo: txnTipo,
        equipos: laptopLabel,
        responsable: fields.responsable || '',
        operador: user ? user.fullName : '',
        curso: fields.curso || '',
        destino: fields.ubicacion || '',
        retirante: '',
        observaciones: fields.observaciones || ''
      });
    }

    close();
    await Cart.render();
    await Summary.update();
  }

  function statusLabel(status) {
    const labels = {
      vacio: 'Vacío',
      almacenada: 'Almacenada',
      enuso: 'En uso',
      excepcion: 'Excepción',
      staff: 'Staff'
    };
    return labels[status] || status;
  }

  function esc(val) { return (val || '').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function dis() { return editMode ? '' : 'disabled'; }

  function init() {
    document.getElementById('modalCloseBtn')?.addEventListener('click', close);
    document.getElementById('laptopModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'laptopModal') close();
    });
  }

  return { init, open, close };
})();
