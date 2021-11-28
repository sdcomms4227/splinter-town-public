
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\Header.svelte generated by Svelte v3.44.2 */

    const file$4 = "src\\components\\Header.svelte";

    function create_fragment$4(ctx) {
    	let header;
    	let nav;
    	let div0;
    	let a0;
    	let span0;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let span2;
    	let span1;
    	let form;
    	let svg0;
    	let g0;
    	let path0;
    	let t3;
    	let input;
    	let t4;
    	let span3;
    	let a1;
    	let svg1;
    	let g1;
    	let circle0;
    	let path1;
    	let t5;
    	let span4;
    	let t6;
    	let a2;
    	let svg2;
    	let g2;
    	let circle1;
    	let path2;

    	const block = {
    		c: function create() {
    			header = element("header");
    			nav = element("nav");
    			div0 = element("div");
    			a0 = element("a");
    			span0 = element("span");
    			span0.textContent = "SPLINTER TOWN";
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			div2 = element("div");
    			span2 = element("span");
    			span1 = element("span");
    			form = element("form");
    			svg0 = svg_element("svg");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			span3 = element("span");
    			a1 = element("a");
    			svg1 = svg_element("svg");
    			g1 = svg_element("g");
    			circle0 = svg_element("circle");
    			path1 = svg_element("path");
    			t5 = space();
    			span4 = element("span");
    			t6 = space();
    			a2 = element("a");
    			svg2 = svg_element("svg");
    			g2 = svg_element("g");
    			circle1 = svg_element("circle");
    			path2 = svg_element("path");
    			attr_dev(span0, "class", "logo svelte-2l3dt7");
    			add_location(span0, file$4, 3, 18, 145);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$4, 3, 6, 133);
    			attr_dev(div0, "class", "small-6 medium-4 large-4 columns Header__logotype");
    			add_location(div0, file$4, 2, 4, 62);
    			attr_dev(div1, "class", "large-1 columns show-for-large large-centered Header__sort");
    			add_location(div1, file$4, 5, 4, 206);
    			attr_dev(path0, "class", "search-input__path");
    			attr_dev(path0, "d", "M14.3681591,18.5706017 L11.3928571,21.6 L14.3681591,18.5706017 C13.273867,17.6916019 12.5714286,16.3293241 12.5714286,14.8 C12.5714286,12.1490332 14.6820862,10 17.2857143,10 C19.8893424,10 22,12.1490332 22,14.8 C22,17.4509668 19.8893424,19.6 17.2857143,19.6 C16.1841009,19.6 15.1707389,19.215281 14.3681591,18.5706017 Z");
    			attr_dev(path0, "id", "icon-svg");
    			add_location(path0, file$4, 12, 16, 667);
    			add_location(g0, file$4, 11, 14, 646);
    			attr_dev(svg0, "class", "search-input__icon");
    			attr_dev(svg0, "width", "42");
    			attr_dev(svg0, "height", "42");
    			attr_dev(svg0, "viewBox", "0 0 32 32");
    			attr_dev(svg0, "version", "1.1");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$4, 10, 12, 506);
    			attr_dev(input, "type", "search");
    			attr_dev(input, "name", "q");
    			attr_dev(input, "class", "search-input__inner");
    			attr_dev(input, "placeholder", "Search");
    			input.value = "";
    			attr_dev(input, "autocomplete", "off");
    			add_location(input, file$4, 19, 12, 1168);
    			attr_dev(form, "class", "search-input--expanded");
    			add_location(form, file$4, 9, 10, 455);
    			add_location(span1, file$4, 8, 8, 437);
    			attr_dev(span2, "class", "Header__search--desktop--new");
    			set_style(span2, "margin-right", "20px");
    			add_location(span2, file$4, 7, 6, 356);
    			attr_dev(circle0, "class", "icon-button icon-button__border icon-button__border--transparent");
    			attr_dev(circle0, "cx", "16");
    			attr_dev(circle0, "cy", "16");
    			attr_dev(circle0, "r", "15");
    			add_location(circle0, file$4, 28, 14, 1631);
    			attr_dev(path1, "class", "icon-button icon-button__magnifyingGlass icon-button--transparent");
    			attr_dev(path1, "d", "M14.3681591,18.5706017 L11.3928571,21.6 L14.3681591,18.5706017 C13.273867,17.6916019 12.5714286,16.3293241 12.5714286,14.8 C12.5714286,12.1490332 14.6820862,10 17.2857143,10 C19.8893424,10 22,12.1490332 22,14.8 C22,17.4509668 19.8893424,19.6 17.2857143,19.6 C16.1841009,19.6 15.1707389,19.215281 14.3681591,18.5706017 Z");
    			attr_dev(path1, "id", "icon-svg");
    			add_location(path1, file$4, 29, 14, 1753);
    			add_location(g1, file$4, 27, 12, 1612);
    			attr_dev(svg1, "class", "icon-button__svg icon-button__svg--transparent icon-button__svg--medium");
    			attr_dev(svg1, "viewBox", "0 0 32 32");
    			attr_dev(svg1, "version", "1.1");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$4, 26, 10, 1444);
    			attr_dev(a1, "href", "/search");
    			add_location(a1, file$4, 25, 8, 1414);
    			attr_dev(span3, "class", "Header__search");
    			add_location(span3, file$4, 24, 6, 1375);
    			attr_dev(span4, "class", "Header__user-signup show-for-medium");
    			add_location(span4, file$4, 38, 6, 2312);
    			attr_dev(circle1, "class", "icon-button icon-button__border icon-button__border--transparent");
    			attr_dev(circle1, "cx", "16");
    			attr_dev(circle1, "cy", "16");
    			attr_dev(circle1, "r", "15");
    			add_location(circle1, file$4, 45, 12, 2727);
    			attr_dev(path2, "class", "icon-button icon-button__pencil icon-button--transparent");
    			attr_dev(path2, "d", "M19.5555556,10.7003165 L21.9259259,13.0706869 L22.6627455,12.3338673 C22.910371,12.0862418 22.910371,11.6847616 22.6627455,11.4371361 L21.1891063,9.96349689 C20.9414809,9.71587141 20.5400006,9.71587141 20.2923752,9.96349689 L19.5555556,10.7003165 Z M18.8571429,11.2929091 L11.015873,19.1341789 L9.77777778,22.8484646 L13.0793651,22.0230678 L21.3333333,13.7690995 L20.5079365,12.9437027 L12.6666667,20.7849726 L11.4285714,21.197671 L11.8412698,19.9595757 L19.6825397,12.1183059 L18.8571429,11.2929091 Z");
    			attr_dev(path2, "id", "icon-svg");
    			add_location(path2, file$4, 46, 12, 2847);
    			add_location(g2, file$4, 44, 10, 2710);
    			attr_dev(svg2, "class", "icon-button__svg icon-button__svg--transparent icon-button__svg--medium");
    			attr_dev(svg2, "viewBox", "0 0 32 32");
    			attr_dev(svg2, "version", "1.1");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file$4, 43, 8, 2544);
    			attr_dev(a2, "href", "/post");
    			add_location(a2, file$4, 42, 6, 2518);
    			attr_dev(div2, "class", "small-6 medium-8 large-7 columns Header__buttons");
    			add_location(div2, file$4, 6, 4, 286);
    			attr_dev(nav, "class", "row Header__nav");
    			add_location(nav, file$4, 1, 2, 27);
    			attr_dev(header, "class", "Header");
    			add_location(header, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, nav);
    			append_dev(nav, div0);
    			append_dev(div0, a0);
    			append_dev(a0, span0);
    			append_dev(nav, t1);
    			append_dev(nav, div1);
    			append_dev(nav, t2);
    			append_dev(nav, div2);
    			append_dev(div2, span2);
    			append_dev(span2, span1);
    			append_dev(span1, form);
    			append_dev(form, svg0);
    			append_dev(svg0, g0);
    			append_dev(g0, path0);
    			append_dev(form, t3);
    			append_dev(form, input);
    			append_dev(div2, t4);
    			append_dev(div2, span3);
    			append_dev(span3, a1);
    			append_dev(a1, svg1);
    			append_dev(svg1, g1);
    			append_dev(g1, circle0);
    			append_dev(g1, path1);
    			append_dev(div2, t5);
    			append_dev(div2, span4);
    			append_dev(div2, t6);
    			append_dev(div2, a2);
    			append_dev(a2, svg2);
    			append_dev(svg2, g2);
    			append_dev(g2, circle1);
    			append_dev(g2, path2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\PostItem.svelte generated by Svelte v3.44.2 */

    const file$3 = "src\\components\\PostItem.svelte";

    // (50:6) {#if image}
    function create_if_block(ctx) {
    	let div;
    	let a;
    	let span;
    	let picture;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			span = element("span");
    			picture = element("picture");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*post*/ ctx[0].title);
    			add_location(img, file$3, 54, 16, 2104);
    			attr_dev(picture, "class", "articles__feature-img");
    			add_location(picture, file$3, 53, 14, 2047);
    			attr_dev(span, "class", "articles__feature-img-container");
    			add_location(span, file$3, 52, 12, 1985);
    			attr_dev(a, "class", "articles__link");
    			attr_dev(a, "href", a_href_value = "" + (baseUrl + /*post*/ ctx[0].url));
    			add_location(a, file$3, 51, 10, 1918);
    			attr_dev(div, "class", "articles__content-block articles__content-block--img");
    			add_location(div, file$3, 50, 8, 1840);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			append_dev(a, span);
    			append_dev(span, picture);
    			append_dev(picture, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*post*/ 1 && img_alt_value !== (img_alt_value = /*post*/ ctx[0].title)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*post*/ 1 && a_href_value !== (a_href_value = "" + (baseUrl + /*post*/ ctx[0].url))) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(50:6) {#if image}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let li;
    	let div8;
    	let div4;
    	let div3;
    	let div1;
    	let a0;
    	let div0;
    	let a0_href_value;
    	let t0;
    	let div2;
    	let span1;
    	let span0;
    	let strong;
    	let a1;
    	let t1_value = /*post*/ ctx[0].author + "";
    	let t1;
    	let a1_href_value;
    	let t2;
    	let span2;
    	let t3;
    	let a2;
    	let t4;
    	let t5_value = /*post*/ ctx[0].parent_permlink + "";
    	let t5;
    	let a2_href_value;
    	let t6;
    	let t7;
    	let span5;
    	let span4;
    	let span3;
    	let t8_value = new Date(/*post*/ ctx[0].created).toDateString() + "";
    	let t8;
    	let t9;
    	let div7;
    	let t10;
    	let div6;
    	let h2;
    	let a3;
    	let span6;
    	let t11_value = /*post*/ ctx[0].title + "";
    	let t11;
    	let a3_href_value;
    	let t12;
    	let div5;
    	let a4;
    	let t13;
    	let a4_href_value;
    	let if_block = /*image*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			div8 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			a0 = element("a");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			span1 = element("span");
    			span0 = element("span");
    			strong = element("strong");
    			a1 = element("a");
    			t1 = text(t1_value);
    			t2 = space();
    			span2 = element("span");
    			t3 = text("in\r\n            ");
    			a2 = element("a");
    			t4 = text("#");
    			t5 = text(t5_value);
    			t6 = text("\r\n             ");
    			t7 = space();
    			span5 = element("span");
    			span4 = element("span");
    			span3 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			div7 = element("div");
    			if (if_block) if_block.c();
    			t10 = space();
    			div6 = element("div");
    			h2 = element("h2");
    			a3 = element("a");
    			span6 = element("span");
    			t11 = text(t11_value);
    			t12 = space();
    			div5 = element("div");
    			a4 = element("a");
    			t13 = text(/*body*/ ctx[1]);
    			attr_dev(div0, "class", "Userpic");
    			set_style(div0, "background-image", "url(\"https://steemitimages.com/u/steemitdev/avatar/small\")");
    			add_location(div0, file$3, 24, 12, 768);
    			attr_dev(a0, "class", "user__link");
    			attr_dev(a0, "href", a0_href_value = "" + (baseUrl + "/@" + /*post*/ ctx[0].author));
    			add_location(a0, file$3, 23, 10, 700);
    			attr_dev(div1, "class", "user__col user__col--left");
    			add_location(div1, file$3, 22, 8, 649);
    			attr_dev(a1, "href", a1_href_value = "" + (baseUrl + "/@" + /*post*/ ctx[0].author));
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$3, 31, 16, 1150);
    			add_location(strong, file$3, 30, 14, 1124);
    			attr_dev(span0, "class", "author");
    			attr_dev(span0, "itemprop", "author");
    			attr_dev(span0, "itemscope", "");
    			attr_dev(span0, "itemtype", "http://schema.org/Person");
    			add_location(span0, file$3, 29, 12, 1020);
    			attr_dev(span1, "class", "user__name");
    			add_location(span1, file$3, 28, 10, 981);
    			attr_dev(a2, "href", a2_href_value = "" + (baseUrl + "/trending/" + /*post*/ ctx[0].parent_permlink));
    			add_location(a2, file$3, 37, 12, 1358);
    			attr_dev(span2, "class", "articles__tag-link");
    			add_location(span2, file$3, 35, 10, 1295);
    			add_location(span3, file$3, 42, 14, 1570);
    			attr_dev(span4, "class", "updated");
    			add_location(span4, file$3, 41, 12, 1532);
    			attr_dev(span5, "class", "timestamp__time");
    			add_location(span5, file$3, 40, 10, 1488);
    			attr_dev(div2, "class", "user__col user__col--right");
    			add_location(div2, file$3, 27, 8, 929);
    			attr_dev(div3, "class", "user");
    			add_location(div3, file$3, 21, 6, 621);
    			attr_dev(div4, "class", "articles__summary-header");
    			add_location(div4, file$3, 20, 4, 575);
    			add_location(span6, file$3, 63, 12, 2410);
    			attr_dev(a3, "href", a3_href_value = "" + (baseUrl + /*post*/ ctx[0].url));
    			add_location(a3, file$3, 62, 10, 2366);
    			attr_dev(h2, "class", "articles__h2 entry-title svelte-fk5t0");
    			add_location(h2, file$3, 61, 8, 2317);
    			attr_dev(a4, "href", a4_href_value = "" + (baseUrl + /*post*/ ctx[0].url));
    			add_location(a4, file$3, 67, 10, 2533);
    			attr_dev(div5, "class", "PostSummary__body entry-content");
    			add_location(div5, file$3, 66, 8, 2476);
    			attr_dev(div6, "class", "articles__content-block articles__content-block--text");
    			add_location(div6, file$3, 60, 6, 2240);
    			attr_dev(div7, "class", "articles__content hentry with-image ");
    			attr_dev(div7, "itemscope", "");
    			attr_dev(div7, "itemtype", "http://schema.org/blogPost");
    			add_location(div7, file$3, 48, 4, 1710);
    			attr_dev(div8, "class", "articles__summary");
    			add_location(div8, file$3, 19, 2, 538);
    			add_location(li, file$3, 18, 0, 530);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div8);
    			append_dev(div8, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, a0);
    			append_dev(a0, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, span1);
    			append_dev(span1, span0);
    			append_dev(span0, strong);
    			append_dev(strong, a1);
    			append_dev(a1, t1);
    			append_dev(div2, t2);
    			append_dev(div2, span2);
    			append_dev(span2, t3);
    			append_dev(span2, a2);
    			append_dev(a2, t4);
    			append_dev(a2, t5);
    			append_dev(span2, t6);
    			append_dev(div2, t7);
    			append_dev(div2, span5);
    			append_dev(span5, span4);
    			append_dev(span4, span3);
    			append_dev(span3, t8);
    			append_dev(div8, t9);
    			append_dev(div8, div7);
    			if (if_block) if_block.m(div7, null);
    			append_dev(div7, t10);
    			append_dev(div7, div6);
    			append_dev(div6, h2);
    			append_dev(h2, a3);
    			append_dev(a3, span6);
    			append_dev(span6, t11);
    			append_dev(div6, t12);
    			append_dev(div6, div5);
    			append_dev(div5, a4);
    			append_dev(a4, t13);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*post*/ 1 && a0_href_value !== (a0_href_value = "" + (baseUrl + "/@" + /*post*/ ctx[0].author))) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*post*/ 1 && t1_value !== (t1_value = /*post*/ ctx[0].author + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*post*/ 1 && a1_href_value !== (a1_href_value = "" + (baseUrl + "/@" + /*post*/ ctx[0].author))) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*post*/ 1 && t5_value !== (t5_value = /*post*/ ctx[0].parent_permlink + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*post*/ 1 && a2_href_value !== (a2_href_value = "" + (baseUrl + "/trending/" + /*post*/ ctx[0].parent_permlink))) {
    				attr_dev(a2, "href", a2_href_value);
    			}

    			if (dirty & /*post*/ 1 && t8_value !== (t8_value = new Date(/*post*/ ctx[0].created).toDateString() + "")) set_data_dev(t8, t8_value);
    			if (/*image*/ ctx[2]) if_block.p(ctx, dirty);
    			if (dirty & /*post*/ 1 && t11_value !== (t11_value = /*post*/ ctx[0].title + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*post*/ 1 && a3_href_value !== (a3_href_value = "" + (baseUrl + /*post*/ ctx[0].url))) {
    				attr_dev(a3, "href", a3_href_value);
    			}

    			if (dirty & /*body*/ 2) set_data_dev(t13, /*body*/ ctx[1]);

    			if (dirty & /*post*/ 1 && a4_href_value !== (a4_href_value = "" + (baseUrl + /*post*/ ctx[0].url))) {
    				attr_dev(a4, "href", a4_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const baseUrl = "https://steemit.com";

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PostItem', slots, []);
    	let { post } = $$props;
    	const json = JSON.parse(post.json_metadata);
    	const image = json.image ? json.image[0] : "";
    	let body = post.body;

    	if (json.image) {
    		json.image.forEach(element => {
    			const imgTitle = element.indexOf("Screenshot") > 0
    			? element.substr(element.indexOf("Screenshot")).replaceAll("%20", " ")
    			: "image.png";

    			$$invalidate(1, body = body.replace(element, ""));
    			$$invalidate(1, body = body.replace("![" + imgTitle + "]()", ""));
    		});
    	}

    	const writable_props = ['post'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PostItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('post' in $$props) $$invalidate(0, post = $$props.post);
    	};

    	$$self.$capture_state = () => ({ post, baseUrl, json, image, body });

    	$$self.$inject_state = $$props => {
    		if ('post' in $$props) $$invalidate(0, post = $$props.post);
    		if ('body' in $$props) $$invalidate(1, body = $$props.body);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [post, body, image];
    }

    class PostItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { post: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostItem",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*post*/ ctx[0] === undefined && !('post' in props)) {
    			console.warn("<PostItem> was created without expected prop 'post'");
    		}
    	}

    	get post() {
    		throw new Error("<PostItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post(value) {
    		throw new Error("<PostItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\PostsList.svelte generated by Svelte v3.44.2 */
    const file$2 = "src\\components\\PostsList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (8:4) {#each postList as post}
    function create_each_block(ctx) {
    	let postitem;
    	let current;

    	postitem = new PostItem({
    			props: { post: /*post*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(postitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(postitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const postitem_changes = {};
    			if (dirty & /*postList*/ 1) postitem_changes.post = /*post*/ ctx[1];
    			postitem.$set(postitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(postitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(8:4) {#each postList as post}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let ul;
    	let current;
    	let each_value = /*postList*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "PostsList__summaries hfeed");
    			attr_dev(ul, "itemscope", "");
    			attr_dev(ul, "itemtype", "http://schema.org/blogPosts");
    			add_location(ul, file$2, 6, 2, 135);
    			attr_dev(div, "id", "posts_list");
    			attr_dev(div, "class", "PostsList");
    			add_location(div, file$2, 5, 0, 92);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*postList*/ 1) {
    				each_value = /*postList*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PostsList', slots, []);
    	let { postList } = $$props;
    	const writable_props = ['postList'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PostsList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('postList' in $$props) $$invalidate(0, postList = $$props.postList);
    	};

    	$$self.$capture_state = () => ({ PostItem, postList });

    	$$self.$inject_state = $$props => {
    		if ('postList' in $$props) $$invalidate(0, postList = $$props.postList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [postList];
    }

    class PostsList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { postList: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostsList",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*postList*/ ctx[0] === undefined && !('postList' in props)) {
    			console.warn("<PostsList> was created without expected prop 'postList'");
    		}
    	}

    	get postList() {
    		throw new Error("<PostsList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set postList(value) {
    		throw new Error("<PostsList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Content.svelte generated by Svelte v3.44.2 */
    const file$1 = "src\\components\\Content.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let article;
    	let postslist;
    	let current;

    	postslist = new PostsList({
    			props: { postList: /*postList*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			article = element("article");
    			create_component(postslist.$$.fragment);
    			attr_dev(article, "class", "articles");
    			add_location(article, file$1, 7, 4, 170);
    			attr_dev(div0, "class", "PostsIndex row layout-list");
    			add_location(div0, file$1, 6, 2, 124);
    			attr_dev(div1, "class", "App__content");
    			add_location(div1, file$1, 5, 0, 94);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, article);
    			mount_component(postslist, article, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const postslist_changes = {};
    			if (dirty & /*postList*/ 1) postslist_changes.postList = /*postList*/ ctx[0];
    			postslist.$set(postslist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postslist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postslist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(postslist);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Content', slots, []);
    	let { postList } = $$props;
    	const writable_props = ['postList'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Content> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('postList' in $$props) $$invalidate(0, postList = $$props.postList);
    	};

    	$$self.$capture_state = () => ({ PostsList, postList });

    	$$self.$inject_state = $$props => {
    		if ('postList' in $$props) $$invalidate(0, postList = $$props.postList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [postList];
    }

    class Content extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { postList: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Content",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*postList*/ ctx[0] === undefined && !('postList' in props)) {
    			console.warn("<Content> was created without expected prop 'postList'");
    		}
    	}

    	get postList() {
    		throw new Error("<Content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set postList(value) {
    		throw new Error("<Content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.2 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let link;
    	let t0;
    	let div;
    	let header;
    	let t1;
    	let content;
    	let current;
    	header = new Header({ $$inline: true });

    	content = new Content({
    			props: { postList: /*postList*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			div = element("div");
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(content.$$.fragment);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://steemit.com/assets/app-72c5aaa5d415d8608575.css");
    			add_location(link, file, 18, 0, 462);
    			attr_dev(div, "class", "theme-light");
    			add_location(div, file, 20, 0, 552);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, link, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			append_dev(div, t1);
    			mount_component(content, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const content_changes = {};
    			if (dirty & /*postList*/ 1) content_changes.postList = /*postList*/ ctx[0];
    			content.$set(content_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(content.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(content.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(header);
    			destroy_component(content);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const author = "msense";
    const startPermlink = "";
    const beforeDate = "2021-11-30T00:00:00";
    const limit = 10;

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let postList = [];

    	steem.api.getDiscussionsByAuthorBeforeDate(author, startPermlink, beforeDate, limit, function (err, result) {
    		if (result) {
    			$$invalidate(0, postList = result);
    			console.log(postList);
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		Content,
    		postList,
    		author,
    		startPermlink,
    		beforeDate,
    		limit
    	});

    	$$self.$inject_state = $$props => {
    		if ('postList' in $$props) $$invalidate(0, postList = $$props.postList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [postList];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
