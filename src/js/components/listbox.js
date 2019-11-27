Vue.component('listbox', {
	/**
	 * component.items should contain a reference to an array
	 * containing items to display in the listbox.
	 */
	props: ['items', 'filter'],

	/**
	 * Reactive instance data.
	 */
	data: function() {
		return {
			scroll: 0,
			scrollRel: 0,
			isScrolling: false,
			slotCount: 1
		}
	},

	/**
	 * Invoked when the component is mounted.
	 * Used to register global mouse listeners and size observer.
	 * ToDo: Unregister these events if the components ever get destroyed.
	 */
	mounted: function() {
		document.addEventListener('mousemove', e => this.moveMouse(e));
		document.addEventListener('mouseup', e => this.stopMouse(e));

		new ResizeObserver(() => this.resize()).observe(this.$el);
	},

	computed: {
		/**
		 * Offset of the scroll widget in pixels.
		 * Between 0 and the height of the component.
		 */
		scrollOffset: function() {
			return (this.scroll) + 'px';
		},

		/**
		 * Index which array reading should start at, based on the current
		 * relative scroll and the overal item count. Value is dynamically
		 * capped based on slot count to prevent empty slots appearing.
		 */
		scrollIndex: function() {
			return Math.floor((this.filteredItems.length - this.slotCount) * this.scrollRel);
		},

		/**
		 * Reactively filtered version of the underlying data array.
		 * Automatically refilters when the filter input is changed.
		 */
		filteredItems: function() {
			const filter = this.$props.filter.trim().toLowerCase();
			if (filter > 0)
				return this.$props.items.filter(e => e.includes(filter));

			return this.$props.items;
		},

		/**
		 * Dynamic array of items which should be displayed from the underlying
		 * data array. Reactively updates based on scroll and data.
		 */
		displayItems: function() {
			return this.filteredItems.slice(this.scrollIndex, this.scrollIndex + this.slotCount);
		},

		/**
		 * Weight (0-1) of a single item.
		 */
		itemWeight: function() {
			return 1 / this.filteredItems.length;
		}
	},

	methods: {
		/**
		 * Invoked by a ResizeObserver when the main component node
		 * is resized due to layout changes.
		 */
		resize: function() {
			const max = this.$el.clientHeight - (this.$refs.scroller.clientHeight);
			this.scroll = max * this.scrollRel;

			if (!this.childHeight) {
				const child = this.$el.querySelector('.item');
				if (child !== null) {
					// Items already exist in list, use height of first.
					this.childHeight = child.clientHeight;
				} else {
					// No items in list, create temporary to measure.
					const temp = document.createElement('div');
					this.$el.appendChild(temp);
					this.childHeight = temp.clientHeight;
					temp.remove();
				}
			}

			this.slotCount = Math.floor(this.$el.clientHeight / this.childHeight);
		},

		/**
		 * Restricts the scroll offset to prevent overflowing and
		 * calculates the relative (0-1) offset based on the scroll.
		 */
		recalculateBounds: function() {
			const max = this.$el.clientHeight - (this.$refs.scroller.clientHeight);
			this.scroll = Math.min(max, Math.max(0, this.scroll));
			this.scrollRel = this.scroll / max;
		},

		/**
		 * Invoked when a mouse-down event is captured on the scroll widget.
		 * @param {MouseEvent} e 
		 */
		startMouse: function(e) {
			this.scrollStartY = e.clientY;
			this.scrollStart = this.scroll;
			this.isScrolling = true;
		},

		/**
		 * Invoked when a mouse-move event is captured globally.
		 * @param {MouseEvent} e 
		 */
		moveMouse: function(e) {
			if (this.isScrolling) {
				this.scroll = this.scrollStart + (e.clientY - this.scrollStartY);
				this.recalculateBounds();
			}
		},

		/**
		 * Invoked when a mouse-up event is captured globally.
		 * @param {MouseEvent} e 
		 */
		stopMouse: function(e) {
			this.isScrolling = false;
		},

		/**
		 * Invoked when a mouse-wheel event is captured on the component node.
		 * @param {WheelEvent} e
		 */
		wheelMouse: function(e) {
			const weight = this.$el.clientHeight - (this.$refs.scroller.clientHeight);
			this.scroll += ((e.deltaY / 10) * this.itemWeight) * weight;
			this.recalculateBounds();
		}
	},

	/**
	 * HTML mark-up to render for this component.
	 */
	template: `<div class="ui-listbox" @wheel="wheelMouse">
		<div class="scroller" ref="scroller" @mousedown="startMouse" :class="{ using: isScrolling }" :style="{ top: scrollOffset }"><div></div></div>
		<div v-for="item in displayItems" class="item">{{ item }}</div>
	</div>`
});