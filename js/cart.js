/**
 * cart.js — Visualización del carro de laptops
 */
const Cart = (() => {
    let selectedSlots = new Set();
    let selectionMode = false;

    const LAPTOP_SVG = `<svg viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="1" width="18" height="24" rx="2" ry="2" fill="currentColor" opacity=".85"/>
    <rect x="5" y="3" width="14" height="16" rx="1" fill="rgba(0,0,0,.3)"/>
    <rect x="1" y="25" width="22" height="3" rx="1.5" fill="currentColor" opacity=".7"/>
    <rect x="9" y="26" width="6" height="1" rx=".5" fill="rgba(255,255,255,.3)"/>
  </svg>`;

    const STATUS_LABELS = {
        vacio: 'Vacío',
        almacenada: 'Almacenada',
        enuso: 'En uso',
        excepcion: 'Excepción',
        staff: 'Staff'
    };

    function render() {
        const container = document.getElementById('cartContainer');
        if (!container) return;

        const slots = DataStore.getAll();
        const activeCart = DataStore.getActiveCart();
        const shelves = activeCart ? activeCart.shelves : ['superior', 'inferior'];

        container.innerHTML = shelves.map(shelf => {
            const shelfSlots = slots.filter(s => s.shelf === shelf).sort((a, b) => a.slotIndex - b.slotIndex);
            const shelfLabel = DataStore.getShelfLabel(shelf);
            return `
        <div class="cart-shelf">
          <div class="cart-shelf__label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3"/>
            </svg>
            Estante ${shelfLabel}
          </div>
          <div class="cart-shelf__grid">
            ${shelfSlots.map(slot => renderSlot(slot)).join('')}
          </div>
        </div>
      `;
        }).join('');

        container.querySelectorAll('.slot').forEach(el => {
            el.addEventListener('click', handleSlotClick);
        });
    }

    function renderSlot(slot) {
        const key = `${slot.shelf}-${slot.slotIndex}`;
        const isSelected = selectedSlots.has(key);
        const statusClass = `slot--${slot.status}`;
        const label = slot.laptopId || '—';
        const tooltipText = slot.laptopId
            ? `${slot.laptopId} — ${STATUS_LABELS[slot.status]}${slot.status === 'enuso' ? ` (${slot.responsable || '?'})` : ''}`
            : `Ranura ${slot.slotIndex + 1} — Vacío`;

        return `
      <div class="slot ${statusClass} ${isSelected ? 'selected' : ''}"
           data-shelf="${slot.shelf}" data-index="${slot.slotIndex}"
           title="">
        <div class="slot__tooltip">${tooltipText}</div>
        <div class="slot__icon">${LAPTOP_SVG}</div>
        <div class="slot__label">${label}</div>
        <div class="slot__number">${slot.slotIndex + 1}</div>
      </div>
    `;
    }

    function handleSlotClick(e) {
        const el = e.currentTarget;
        const shelf = el.dataset.shelf;
        const index = parseInt(el.dataset.index);
        const key = `${shelf}-${index}`;

        if (selectionMode) {
            if (selectedSlots.has(key)) {
                selectedSlots.delete(key);
                el.classList.remove('selected');
            } else {
                const slot = DataStore.getSlot(shelf, index);
                if (slot && slot.laptopId) {
                    selectedSlots.add(key);
                    el.classList.add('selected');
                }
            }
            updateMassDeliveryBar();
        } else {
            Modal.open(shelf, index);
        }
    }

    function toggleSelectionMode() {
        selectionMode = !selectionMode;
        if (!selectionMode) {
            clearSelection();
        }
        document.getElementById('selectionModeBtn')?.classList.toggle('btn--primary', selectionMode);
        document.getElementById('selectionModeBtn')?.classList.toggle('btn--secondary', !selectionMode);

        const label = document.getElementById('selectionModeLabel');
        if (label) label.textContent = selectionMode ? 'Cancelar Selección' : 'Selección Múltiple';

        if (!selectionMode) {
            document.querySelector('.mass-delivery-bar')?.classList.remove('visible');
        }
    }

    function clearSelection() {
        selectedSlots.clear();
        document.querySelectorAll('.slot.selected').forEach(el => el.classList.remove('selected'));
        document.querySelector('.mass-delivery-bar')?.classList.remove('visible');
    }

    function updateMassDeliveryBar() {
        const bar = document.querySelector('.mass-delivery-bar');
        const countEl = document.getElementById('selectedCount');
        if (bar && countEl) {
            countEl.textContent = selectedSlots.size;
            bar.classList.toggle('visible', selectedSlots.size > 0);
        }
    }

    function getSelectedSlots() {
        return Array.from(selectedSlots).map(key => {
            const [shelf, index] = key.split('-');
            return { shelf, index: parseInt(index) };
        });
    }

    function isSelectionMode() { return selectionMode; }

    return { render, toggleSelectionMode, clearSelection, getSelectedSlots, isSelectionMode };
})();
