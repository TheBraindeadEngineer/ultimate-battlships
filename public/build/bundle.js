
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
            mount_component(component, options.target, options.anchor);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.3' }, detail)));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
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

    /* src\components\Grid.svelte generated by Svelte v3.32.3 */
    const file = "src\\components\\Grid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    // (202:4) {#each ids as id}
    function create_each_block(ctx) {
    	let div;
    	let p;

    	let raw_value = (/*guesses*/ ctx[1].misses.includes(/*id*/ ctx[23])
    	? "&#10005;"
    	: "") + "";

    	let t;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	function mouseenter_handler() {
    		return /*mouseenter_handler*/ ctx[16](/*id*/ ctx[23]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[17](/*id*/ ctx[23]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t = space();
    			attr_dev(p, "class", "svelte-19u7kvv");
    			toggle_class(p, "large", /*ref*/ ctx[2] == "grid-1");
    			add_location(p, file, 211, 12, 6403);
    			attr_dev(div, "id", div_id_value = /*id*/ ctx[23]);
    			attr_dev(div, "class", "grid-square svelte-19u7kvv");

    			toggle_class(div, "ship", /*hideShips*/ ctx[3]
    			? /*allHits*/ ctx[7]().includes(/*id*/ ctx[23])
    			: /*allPos*/ ctx[6]().includes(/*id*/ ctx[23]));

    			toggle_class(div, "selectedShip", /*selectedShip*/ ctx[0] && /*selectedShip*/ ctx[0].pos.includes(/*id*/ ctx[23]));
    			toggle_class(div, "disable", /*ref*/ ctx[2] == "grid-2");
    			toggle_class(div, "overlap", /*allHits*/ ctx[7]().includes(/*id*/ ctx[23]) || /*allPos*/ ctx[6]().includes(/*id*/ ctx[23]) && /*selectedShip*/ ctx[0] && /*selectedShip*/ ctx[0].pos.includes(/*id*/ ctx[23]));
    			add_location(div, file, 202, 8, 5900);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			p.innerHTML = raw_value;
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "mouseenter", mouseenter_handler, false, false, false),
    					listen_dev(div, "click", click_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*guesses, ids*/ 34 && raw_value !== (raw_value = (/*guesses*/ ctx[1].misses.includes(/*id*/ ctx[23])
    			? "&#10005;"
    			: "") + "")) p.innerHTML = raw_value;
    			if (dirty & /*ref*/ 4) {
    				toggle_class(p, "large", /*ref*/ ctx[2] == "grid-1");
    			}

    			if (dirty & /*ids*/ 32 && div_id_value !== (div_id_value = /*id*/ ctx[23])) {
    				attr_dev(div, "id", div_id_value);
    			}

    			if (dirty & /*hideShips, allHits, ids, allPos*/ 232) {
    				toggle_class(div, "ship", /*hideShips*/ ctx[3]
    				? /*allHits*/ ctx[7]().includes(/*id*/ ctx[23])
    				: /*allPos*/ ctx[6]().includes(/*id*/ ctx[23]));
    			}

    			if (dirty & /*selectedShip, ids*/ 33) {
    				toggle_class(div, "selectedShip", /*selectedShip*/ ctx[0] && /*selectedShip*/ ctx[0].pos.includes(/*id*/ ctx[23]));
    			}

    			if (dirty & /*ref*/ 4) {
    				toggle_class(div, "disable", /*ref*/ ctx[2] == "grid-2");
    			}

    			if (dirty & /*allHits, ids, allPos, selectedShip*/ 225) {
    				toggle_class(div, "overlap", /*allHits*/ ctx[7]().includes(/*id*/ ctx[23]) || /*allPos*/ ctx[6]().includes(/*id*/ ctx[23]) && /*selectedShip*/ ctx[0] && /*selectedShip*/ ctx[0].pos.includes(/*id*/ ctx[23]));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(202:4) {#each ids as id}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let mounted;
    	let dispose;
    	let each_value = /*ids*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "ref", /*ref*/ ctx[2]);
    			attr_dev(div, "class", "grid-container svelte-19u7kvv");
    			add_location(div, file, 197, 0, 5777);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(div, "mouseleave", /*mouseleave_handler*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*ids, hideShips, allHits, allPos, selectedShip, ref, currentPos, handleClick, guesses*/ 767) {
    				each_value = /*ids*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*ref*/ 4) {
    				attr_dev(div, "ref", /*ref*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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

    function instance($$self, $$props, $$invalidate) {
    	let allPos;
    	let allHits;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Grid", slots, []);
    	const dispatch = createEventDispatcher();
    	let { ref } = $$props;
    	let { state } = $$props;
    	let { ships } = $$props;
    	let { selectedShip } = $$props;
    	let { orientation } = $$props;
    	let { hasOverlap } = $$props;
    	let { hideShips = false } = $$props;
    	let { guesses } = $$props;
    	let { activePlayer } = $$props;
    	let currentPos;
    	let ids = [];
    	onMount(() => createIDs());

    	function createIDs() {
    		for (let y = 0; y < 10; y++) {
    			for (let x = 0; x < 10; x++) {
    				$$invalidate(5, ids = [...ids, `${x}${y}`]);
    			}
    		}
    	}

    	function handleMouseLeave() {
    		if (selectedShip) $$invalidate(0, selectedShip.pos = [], selectedShip);
    		$$invalidate(4, currentPos = null);
    	}

    	function handleClick() {
    		if (state === "placement" && selectedShip) {
    			if (saveShipPos()) $$invalidate(0, selectedShip = null);
    		} else if (state === "placement" && !selectedShip) {
    			// select already placed ship
    			ships.forEach(s => {
    				if (s.pos.includes(currentPos)) {
    					let sel = { ...s };

    					// clear ship positions to update select button state
    					$$invalidate(10, ships[ships.findIndex(s => s.type === sel.type)].pos = [], ships);

    					$$invalidate(0, selectedShip = sel);
    				}
    			});
    		} else if (activePlayer == "player") {
    			let hit = false;

    			ships.forEach((s, i) => {
    				if (s.pos.includes(currentPos) && !guesses.hits.includes(currentPos)) {
    					$$invalidate(10, ships[i] = { ...s, hits: [...s.hits, currentPos] }, ships);
    					hit = true;

    					$$invalidate(1, guesses = {
    						...guesses,
    						hits: [...guesses.hits, currentPos]
    					});

    					dispatch("turn", { guesses, activePlayer: "opponent" });
    				}
    			});

    			if (!hit && !guesses.misses.includes(currentPos) && !guesses.hits.includes(currentPos)) {
    				$$invalidate(1, guesses = {
    					...guesses,
    					misses: [...guesses.misses, currentPos]
    				});

    				dispatch("turn", { guesses, activePlayer: "opponent" });
    			}
    		}
    	}

    	function updateShipPos() {
    		if (selectedShip) {
    			let parsedCurrentPos = currentPos.split("").map(c => parseInt(c));
    			let x = parsedCurrentPos[0];
    			let y = parsedCurrentPos[1];
    			let pos = [];
    			const constrain = (pos, size) => pos > 10 - size ? 10 - size : pos;

    			if (orientation === "horizontal") {
    				x = constrain(parsedCurrentPos[0], selectedShip.size);

    				for (let i = x; i < x + selectedShip.size; i++) {
    					pos.push(`${i}${y}`);
    				}
    			} else {
    				y = constrain(parsedCurrentPos[1], selectedShip.size);

    				for (let j = y; j < y + selectedShip.size; j++) {
    					pos.push(`${x}${j}`);
    				}
    			}

    			$$invalidate(0, selectedShip = { ...selectedShip, pos });
    		}
    	}

    	function saveShipPos() {
    		const hasNoOverlap = () => selectedShip.pos.every(e => !allPos().includes(e));

    		if (hasNoOverlap()) {
    			$$invalidate(12, hasOverlap = false);
    			let index = ships.findIndex(e => e.type === selectedShip.type);
    			$$invalidate(10, ships[index] = selectedShip, ships);
    			return true;
    		}

    		$$invalidate(12, hasOverlap = true);
    		return false;
    	}

    	function placeRandom() {
    		const dirs = ["horizontal", "vertical"];
    		const randDir = () => dirs[Math.floor(Math.random() * 2)];

    		const randPos = () => {
    			let randX = Math.floor(Math.random() * 10);
    			let randY = Math.floor(Math.random() * 10);
    			return `${randX}${randY}`;
    		};

    		ships.forEach(ship => {
    			$$invalidate(4, currentPos = randPos());
    			$$invalidate(11, orientation = randDir());
    			$$invalidate(0, selectedShip = ship);
    			updateShipPos();

    			while (!saveShipPos()) {
    				$$invalidate(4, currentPos = randPos());
    				$$invalidate(11, orientation = randDir());
    				updateShipPos();
    			}

    			$$invalidate(0, selectedShip = null);
    			$$invalidate(4, currentPos = null);
    		});
    	}

    	const writable_props = [
    		"ref",
    		"state",
    		"ships",
    		"selectedShip",
    		"orientation",
    		"hasOverlap",
    		"hideShips",
    		"guesses",
    		"activePlayer"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Grid> was created with unknown prop '${key}'`);
    	});

    	const mouseenter_handler = id => $$invalidate(4, currentPos = id);
    	const click_handler = id => handleClick();
    	const mouseleave_handler = () => handleMouseLeave();

    	$$self.$$set = $$props => {
    		if ("ref" in $$props) $$invalidate(2, ref = $$props.ref);
    		if ("state" in $$props) $$invalidate(13, state = $$props.state);
    		if ("ships" in $$props) $$invalidate(10, ships = $$props.ships);
    		if ("selectedShip" in $$props) $$invalidate(0, selectedShip = $$props.selectedShip);
    		if ("orientation" in $$props) $$invalidate(11, orientation = $$props.orientation);
    		if ("hasOverlap" in $$props) $$invalidate(12, hasOverlap = $$props.hasOverlap);
    		if ("hideShips" in $$props) $$invalidate(3, hideShips = $$props.hideShips);
    		if ("guesses" in $$props) $$invalidate(1, guesses = $$props.guesses);
    		if ("activePlayer" in $$props) $$invalidate(14, activePlayer = $$props.activePlayer);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		dispatch,
    		ref,
    		state,
    		ships,
    		selectedShip,
    		orientation,
    		hasOverlap,
    		hideShips,
    		guesses,
    		activePlayer,
    		currentPos,
    		ids,
    		createIDs,
    		handleMouseLeave,
    		handleClick,
    		updateShipPos,
    		saveShipPos,
    		placeRandom,
    		allPos,
    		allHits
    	});

    	$$self.$inject_state = $$props => {
    		if ("ref" in $$props) $$invalidate(2, ref = $$props.ref);
    		if ("state" in $$props) $$invalidate(13, state = $$props.state);
    		if ("ships" in $$props) $$invalidate(10, ships = $$props.ships);
    		if ("selectedShip" in $$props) $$invalidate(0, selectedShip = $$props.selectedShip);
    		if ("orientation" in $$props) $$invalidate(11, orientation = $$props.orientation);
    		if ("hasOverlap" in $$props) $$invalidate(12, hasOverlap = $$props.hasOverlap);
    		if ("hideShips" in $$props) $$invalidate(3, hideShips = $$props.hideShips);
    		if ("guesses" in $$props) $$invalidate(1, guesses = $$props.guesses);
    		if ("activePlayer" in $$props) $$invalidate(14, activePlayer = $$props.activePlayer);
    		if ("currentPos" in $$props) $$invalidate(4, currentPos = $$props.currentPos);
    		if ("ids" in $$props) $$invalidate(5, ids = $$props.ids);
    		if ("allPos" in $$props) $$invalidate(6, allPos = $$props.allPos);
    		if ("allHits" in $$props) $$invalidate(7, allHits = $$props.allHits);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selectedShip, ships*/ 1025) {
    			$$invalidate(6, allPos = () => {
    				if (selectedShip) {
    					return ships.map(s => s.type !== selectedShip.type ? s.pos : []).flat();
    				} else {
    					return ships.map(s => s.pos).flat();
    				}
    			});
    		}

    		if ($$self.$$.dirty & /*ships*/ 1024) {
    			$$invalidate(7, allHits = () => ships.map(s => s.hits).flat());
    		}

    		if ($$self.$$.dirty & /*orientation, selectedShip, currentPos*/ 2065) {
    			if (orientation && selectedShip && currentPos) updateShipPos();
    		}
    	};

    	return [
    		selectedShip,
    		guesses,
    		ref,
    		hideShips,
    		currentPos,
    		ids,
    		allPos,
    		allHits,
    		handleMouseLeave,
    		handleClick,
    		ships,
    		orientation,
    		hasOverlap,
    		state,
    		activePlayer,
    		placeRandom,
    		mouseenter_handler,
    		click_handler,
    		mouseleave_handler
    	];
    }

    class Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			ref: 2,
    			state: 13,
    			ships: 10,
    			selectedShip: 0,
    			orientation: 11,
    			hasOverlap: 12,
    			hideShips: 3,
    			guesses: 1,
    			activePlayer: 14,
    			placeRandom: 15
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grid",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*ref*/ ctx[2] === undefined && !("ref" in props)) {
    			console.warn("<Grid> was created without expected prop 'ref'");
    		}

    		if (/*state*/ ctx[13] === undefined && !("state" in props)) {
    			console.warn("<Grid> was created without expected prop 'state'");
    		}

    		if (/*ships*/ ctx[10] === undefined && !("ships" in props)) {
    			console.warn("<Grid> was created without expected prop 'ships'");
    		}

    		if (/*selectedShip*/ ctx[0] === undefined && !("selectedShip" in props)) {
    			console.warn("<Grid> was created without expected prop 'selectedShip'");
    		}

    		if (/*orientation*/ ctx[11] === undefined && !("orientation" in props)) {
    			console.warn("<Grid> was created without expected prop 'orientation'");
    		}

    		if (/*hasOverlap*/ ctx[12] === undefined && !("hasOverlap" in props)) {
    			console.warn("<Grid> was created without expected prop 'hasOverlap'");
    		}

    		if (/*guesses*/ ctx[1] === undefined && !("guesses" in props)) {
    			console.warn("<Grid> was created without expected prop 'guesses'");
    		}

    		if (/*activePlayer*/ ctx[14] === undefined && !("activePlayer" in props)) {
    			console.warn("<Grid> was created without expected prop 'activePlayer'");
    		}
    	}

    	get ref() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ships() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ships(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedShip() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedShip(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get orientation() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set orientation(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasOverlap() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasOverlap(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideShips() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideShips(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get guesses() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set guesses(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activePlayer() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activePlayer(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeRandom() {
    		return this.$$.ctx[15];
    	}

    	set placeRandom(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ShipSelect.svelte generated by Svelte v3.32.3 */

    const file$1 = "src\\components\\ShipSelect.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (43:8) {#each ships as ship}
    function create_each_block$1(ctx) {
    	let li;
    	let t0_value = /*ship*/ ctx[7].type.charAt(0).toUpperCase() + /*ship*/ ctx[7].type.slice(1) + "";
    	let t0;
    	let t1;
    	let t2_value = /*ship*/ ctx[7].size + "";
    	let t2;
    	let t3;

    	let t4_value = (/*hoverShip*/ ctx[2] && /*hoverShip*/ ctx[2].type === /*ship*/ ctx[7].type
    	? " <--"
    	: "") + "";

    	let t4;
    	let t5;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*ship*/ ctx[7]);
    	}

    	function mouseenter_handler() {
    		return /*mouseenter_handler*/ ctx[5](/*ship*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text("\r\n                (");
    			t2 = text(t2_value);
    			t3 = text(") ");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(li, "class", "svelte-l0p38j");
    			toggle_class(li, "selectedShip", /*selectedShip*/ ctx[1] && /*selectedShip*/ ctx[1].type === /*ship*/ ctx[7].type);
    			toggle_class(li, "placed", /*ship*/ ctx[7].pos.length > 0);
    			toggle_class(li, "sunk", /*ship*/ ctx[7].hits.length == /*ship*/ ctx[7].size);
    			add_location(li, file$1, 43, 12, 800);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    			append_dev(li, t4);
    			append_dev(li, t5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(li, "click", click_handler, false, false, false),
    					listen_dev(li, "mouseenter", mouseenter_handler, false, false, false),
    					listen_dev(li, "mouseleave", /*mouseleave_handler*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*ships*/ 1 && t0_value !== (t0_value = /*ship*/ ctx[7].type.charAt(0).toUpperCase() + /*ship*/ ctx[7].type.slice(1) + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*ships*/ 1 && t2_value !== (t2_value = /*ship*/ ctx[7].size + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*hoverShip, ships*/ 5 && t4_value !== (t4_value = (/*hoverShip*/ ctx[2] && /*hoverShip*/ ctx[2].type === /*ship*/ ctx[7].type
    			? " <--"
    			: "") + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*selectedShip, ships*/ 3) {
    				toggle_class(li, "selectedShip", /*selectedShip*/ ctx[1] && /*selectedShip*/ ctx[1].type === /*ship*/ ctx[7].type);
    			}

    			if (dirty & /*ships*/ 1) {
    				toggle_class(li, "placed", /*ship*/ ctx[7].pos.length > 0);
    			}

    			if (dirty & /*ships*/ 1) {
    				toggle_class(li, "sunk", /*ship*/ ctx[7].hits.length == /*ship*/ ctx[7].size);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(43:8) {#each ships as ship}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let hr;
    	let t2;
    	let ul;
    	let each_value = /*ships*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Select Ship";
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_style(h3, "margin-left", "20px");
    			add_location(h3, file$1, 39, 4, 689);
    			add_location(hr, file$1, 40, 4, 741);
    			attr_dev(ul, "class", "svelte-l0p38j");
    			add_location(ul, file$1, 41, 4, 751);
    			attr_dev(div, "id", "select-container");
    			add_location(div, file$1, 38, 0, 656);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			append_dev(div, hr);
    			append_dev(div, t2);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selectedShip, ships, handleClick, hoverShip*/ 15) {
    				each_value = /*ships*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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
    	validate_slots("ShipSelect", slots, []);
    	let { ships } = $$props;
    	let { selectedShip } = $$props;
    	let hoverShip = null;

    	function handleClick(ship) {
    		$$invalidate(1, selectedShip = ship);
    		$$invalidate(0, ships[ships.findIndex(s => s.type === ship.type)].pos = [], ships);
    	}

    	const writable_props = ["ships", "selectedShip"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ShipSelect> was created with unknown prop '${key}'`);
    	});

    	const click_handler = ship => handleClick(ship);
    	const mouseenter_handler = ship => $$invalidate(2, hoverShip = ship);
    	const mouseleave_handler = () => $$invalidate(2, hoverShip = null);

    	$$self.$$set = $$props => {
    		if ("ships" in $$props) $$invalidate(0, ships = $$props.ships);
    		if ("selectedShip" in $$props) $$invalidate(1, selectedShip = $$props.selectedShip);
    	};

    	$$self.$capture_state = () => ({
    		ships,
    		selectedShip,
    		hoverShip,
    		handleClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("ships" in $$props) $$invalidate(0, ships = $$props.ships);
    		if ("selectedShip" in $$props) $$invalidate(1, selectedShip = $$props.selectedShip);
    		if ("hoverShip" in $$props) $$invalidate(2, hoverShip = $$props.hoverShip);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		ships,
    		selectedShip,
    		hoverShip,
    		handleClick,
    		click_handler,
    		mouseenter_handler,
    		mouseleave_handler
    	];
    }

    class ShipSelect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { ships: 0, selectedShip: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShipSelect",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*ships*/ ctx[0] === undefined && !("ships" in props)) {
    			console.warn("<ShipSelect> was created without expected prop 'ships'");
    		}

    		if (/*selectedShip*/ ctx[1] === undefined && !("selectedShip" in props)) {
    			console.warn("<ShipSelect> was created without expected prop 'selectedShip'");
    		}
    	}

    	get ships() {
    		throw new Error("<ShipSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ships(value) {
    		throw new Error("<ShipSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedShip() {
    		throw new Error("<ShipSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedShip(value) {
    		throw new Error("<ShipSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\PlacementOptions.svelte generated by Svelte v3.32.3 */
    const file$2 = "src\\components\\PlacementOptions.svelte";

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "⚄";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "⬚";
    			attr_dev(div0, "class", "svelte-1xm96op");
    			add_location(div0, file$2, 24, 4, 469);
    			attr_dev(div1, "class", "svelte-1xm96op");
    			add_location(div1, file$2, 25, 4, 532);
    			attr_dev(div2, "id", "options-container");
    			attr_dev(div2, "class", "svelte-1xm96op");
    			add_location(div2, file$2, 23, 0, 435);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("PlacementOptions", slots, []);
    	const dispatch = createEventDispatcher();
    	let { state } = $$props;

    	function handleClick(type) {
    		if (state == "placement") dispatch(type);
    	}

    	const writable_props = ["state"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PlacementOptions> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handleClick("random");
    	const click_handler_1 = () => handleClick("clear");

    	$$self.$$set = $$props => {
    		if ("state" in $$props) $$invalidate(1, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		state,
    		handleClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("state" in $$props) $$invalidate(1, state = $$props.state);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [handleClick, state, click_handler, click_handler_1];
    }

    class PlacementOptions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { state: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlacementOptions",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*state*/ ctx[1] === undefined && !("state" in props)) {
    			console.warn("<PlacementOptions> was created without expected prop 'state'");
    		}
    	}

    	get state() {
    		throw new Error("<PlacementOptions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<PlacementOptions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\OrientationBtn.svelte generated by Svelte v3.32.3 */

    const file$3 = "src\\components\\OrientationBtn.svelte";

    // (26:4) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("↓");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(26:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:4) {#if orientation === "horizontal"}
    function create_if_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("→");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(24:4) {#if orientation === \\\"horizontal\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let h2;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*orientation*/ ctx[0] === "horizontal") return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			if_block.c();
    			attr_dev(h2, "class", "svelte-13xad3u");
    			add_location(h2, file$3, 22, 0, 548);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			if_block.m(h2, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keydown", /*keydown_handler*/ ctx[2], false, false, false),
    					listen_dev(h2, "click", /*click_handler*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(h2, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("OrientationBtn", slots, []);
    	let { orientation } = $$props;

    	function changeOrientation(event) {
    		if (event && event.keyCode === 32) {
    			$$invalidate(0, orientation = orientation === "horizontal" ? "vertical" : "horizontal");
    			return;
    		} else if (!event) {
    			$$invalidate(0, orientation = orientation === "horizontal" ? "vertical" : "horizontal");
    		}
    	}

    	const writable_props = ["orientation"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OrientationBtn> was created with unknown prop '${key}'`);
    	});

    	const keydown_handler = e => changeOrientation(e);
    	const click_handler = () => changeOrientation();

    	$$self.$$set = $$props => {
    		if ("orientation" in $$props) $$invalidate(0, orientation = $$props.orientation);
    	};

    	$$self.$capture_state = () => ({ orientation, changeOrientation });

    	$$self.$inject_state = $$props => {
    		if ("orientation" in $$props) $$invalidate(0, orientation = $$props.orientation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [orientation, changeOrientation, keydown_handler, click_handler];
    }

    class OrientationBtn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { orientation: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OrientationBtn",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*orientation*/ ctx[0] === undefined && !("orientation" in props)) {
    			console.warn("<OrientationBtn> was created without expected prop 'orientation'");
    		}
    	}

    	get orientation() {
    		throw new Error("<OrientationBtn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set orientation(value) {
    		throw new Error("<OrientationBtn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src\components\StartNew.svelte generated by Svelte v3.32.3 */
    const file$4 = "src\\components\\StartNew.svelte";

    // (82:4) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let h3;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "New Game";
    			attr_dev(h3, "class", "svelte-z04hzh");
    			add_location(h3, file$4, 83, 12, 2073);
    			attr_dev(div, "ref", /*ref*/ ctx[0]);
    			attr_dev(div, "class", "alert-container inactive svelte-z04hzh");
    			add_location(div, file$4, 82, 8, 1967);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_4*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*ref*/ 1) {
    				attr_dev(div, "ref", /*ref*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(82:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (74:4) {#if newGame}
    function create_if_block_2(ctx) {
    	let div1;
    	let h3;
    	let t1;
    	let div0;
    	let p0;
    	let t3;
    	let p1;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Are you sure?";
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "YES";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "NO";
    			attr_dev(h3, "class", "svelte-z04hzh");
    			add_location(h3, file$4, 75, 12, 1694);
    			attr_dev(p0, "class", "yes-no svelte-z04hzh");
    			add_location(p0, file$4, 77, 16, 1775);
    			attr_dev(p1, "class", "yes-no svelte-z04hzh");
    			add_location(p1, file$4, 78, 16, 1851);
    			attr_dev(div0, "id", "yes-no-container");
    			attr_dev(div0, "class", "svelte-z04hzh");
    			add_location(div0, file$4, 76, 12, 1730);
    			attr_dev(div1, "ref", /*ref*/ ctx[0]);
    			attr_dev(div1, "class", "alert-container active svelte-z04hzh");
    			add_location(div1, file$4, 74, 8, 1622);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, p1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(p0, "click", /*click_handler_2*/ ctx[8], false, false, false),
    					listen_dev(p1, "click", /*click_handler_3*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*ref*/ 1) {
    				attr_dev(div1, "ref", /*ref*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(74:4) {#if newGame}",
    		ctx
    	});

    	return block;
    }

    // (61:0) {#if state == "placement"}
    function create_if_block$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*canStartGame*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(61:0) {#if state == \\\"placement\\\"}",
    		ctx
    	});

    	return block;
    }

    // (67:4) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let h3;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Start Game";
    			attr_dev(h3, "class", "svelte-z04hzh");
    			add_location(h3, file$4, 69, 12, 1538);
    			attr_dev(div, "ref", /*ref*/ ctx[0]);
    			attr_dev(div, "class", "alert-container inactive svelte-z04hzh");
    			add_location(div, file$4, 67, 8, 1416);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_1*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*ref*/ 1) {
    				attr_dev(div, "ref", /*ref*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(67:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (62:4) {#if canStartGame}
    function create_if_block_1(ctx) {
    	let div;
    	let h3;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Start Game";
    			attr_dev(h3, "class", "svelte-z04hzh");
    			add_location(h3, file$4, 64, 12, 1358);
    			attr_dev(div, "ref", /*ref*/ ctx[0]);
    			attr_dev(div, "class", "alert-container active svelte-z04hzh");
    			add_location(div, file$4, 62, 8, 1238);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*ref*/ 1) {
    				attr_dev(div, "ref", /*ref*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(62:4) {#if canStartGame}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_if_block_2, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*state*/ ctx[1] == "placement") return 0;
    		if (/*newGame*/ ctx[3]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StartNew", slots, []);
    	const dispatch = createEventDispatcher();
    	let { ref } = $$props;
    	let { state } = $$props;
    	let { canStartGame } = $$props;
    	let newGame = false;

    	function handleNewGame() {
    		dispatch("newGame");
    		$$invalidate(3, newGame = false);
    	}

    	const writable_props = ["ref", "state", "canStartGame"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StartNew> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("start");
    	const click_handler_1 = () => dispatch("start");
    	const click_handler_2 = () => handleNewGame();
    	const click_handler_3 = () => $$invalidate(3, newGame = false);
    	const click_handler_4 = () => $$invalidate(3, newGame = true);

    	$$self.$$set = $$props => {
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("state" in $$props) $$invalidate(1, state = $$props.state);
    		if ("canStartGame" in $$props) $$invalidate(2, canStartGame = $$props.canStartGame);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		createEventDispatcher,
    		dispatch,
    		ref,
    		state,
    		canStartGame,
    		newGame,
    		handleNewGame
    	});

    	$$self.$inject_state = $$props => {
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("state" in $$props) $$invalidate(1, state = $$props.state);
    		if ("canStartGame" in $$props) $$invalidate(2, canStartGame = $$props.canStartGame);
    		if ("newGame" in $$props) $$invalidate(3, newGame = $$props.newGame);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		ref,
    		state,
    		canStartGame,
    		newGame,
    		dispatch,
    		handleNewGame,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class StartNew extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { ref: 0, state: 1, canStartGame: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartNew",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*ref*/ ctx[0] === undefined && !("ref" in props)) {
    			console.warn("<StartNew> was created without expected prop 'ref'");
    		}

    		if (/*state*/ ctx[1] === undefined && !("state" in props)) {
    			console.warn("<StartNew> was created without expected prop 'state'");
    		}

    		if (/*canStartGame*/ ctx[2] === undefined && !("canStartGame" in props)) {
    			console.warn("<StartNew> was created without expected prop 'canStartGame'");
    		}
    	}

    	get ref() {
    		throw new Error("<StartNew>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<StartNew>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<StartNew>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<StartNew>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get canStartGame() {
    		throw new Error("<StartNew>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canStartGame(value) {
    		throw new Error("<StartNew>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\WonLost.svelte generated by Svelte v3.32.3 */
    const file$5 = "src\\components\\WonLost.svelte";

    // (28:4) {:else}
    function create_else_block$2(ctx) {
    	let div;
    	let h10;
    	let t1;
    	let h11;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h10 = element("h1");
    			h10.textContent = "Y O U";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "L O S T !";
    			add_location(h10, file$5, 29, 12, 666);
    			add_location(h11, file$5, 30, 12, 694);
    			attr_dev(div, "class", "message svelte-qv9uo");
    			add_location(div, file$5, 28, 8, 631);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h10);
    			append_dev(div, t1);
    			append_dev(div, h11);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(28:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (23:4) {#if winner() == 'player'}
    function create_if_block$2(ctx) {
    	let div;
    	let h10;
    	let t1;
    	let h11;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h10 = element("h1");
    			h10.textContent = "Y O U";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "W O N !";
    			add_location(h10, file$5, 24, 12, 548);
    			add_location(h11, file$5, 25, 12, 576);
    			attr_dev(div, "class", "message svelte-qv9uo");
    			add_location(div, file$5, 23, 8, 513);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h10);
    			append_dev(div, t1);
    			append_dev(div, h11);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(23:4) {#if winner() == 'player'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let show_if;
    	let div_transition;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*winner*/ 2) show_if = !!(/*winner*/ ctx[1]() == "player");
    		if (show_if) return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "ref", /*ref*/ ctx[0]);
    			attr_dev(div, "id", "message-container");
    			attr_dev(div, "class", "svelte-qv9uo");
    			add_location(div, file$5, 21, 0, 421);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx, dirty))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (!current || dirty & /*ref*/ 1) {
    				attr_dev(div, "ref", /*ref*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WonLost", slots, []);
    	let { ref } = $$props;
    	let { winner } = $$props;
    	const writable_props = ["ref", "winner"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WonLost> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("winner" in $$props) $$invalidate(1, winner = $$props.winner);
    	};

    	$$self.$capture_state = () => ({ fade, ref, winner });

    	$$self.$inject_state = $$props => {
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("winner" in $$props) $$invalidate(1, winner = $$props.winner);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ref, winner];
    }

    class WonLost extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { ref: 0, winner: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WonLost",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*ref*/ ctx[0] === undefined && !("ref" in props)) {
    			console.warn("<WonLost> was created without expected prop 'ref'");
    		}

    		if (/*winner*/ ctx[1] === undefined && !("winner" in props)) {
    			console.warn("<WonLost> was created without expected prop 'winner'");
    		}
    	}

    	get ref() {
    		throw new Error("<WonLost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<WonLost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get winner() {
    		throw new Error("<WonLost>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set winner(value) {
    		throw new Error("<WonLost>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.32.3 */
    const file$6 = "src\\App.svelte";

    // (220:4) {#if winner()}
    function create_if_block$3(ctx) {
    	let wonlost;
    	let current;

    	wonlost = new WonLost({
    			props: {
    				ref: "grid-1",
    				winner: /*winner*/ ctx[12]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wonlost.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(wonlost, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const wonlost_changes = {};
    			if (dirty[0] & /*winner*/ 4096) wonlost_changes.winner = /*winner*/ ctx[12];
    			wonlost.$set(wonlost_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wonlost.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wonlost.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wonlost, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(220:4) {#if winner()}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div0;
    	let h10;
    	let t1;
    	let h11;
    	let t3;
    	let h12;
    	let t5;
    	let h13;
    	let t7;
    	let h14;
    	let t9;
    	let h15;
    	let t11;
    	let h16;
    	let t13;
    	let h17;
    	let t15;
    	let h18;
    	let t17;
    	let h19;
    	let t19;
    	let div2;
    	let grid0;
    	let updating_selectedShip;
    	let updating_hasOverlap;
    	let updating_ships;
    	let t20;
    	let div1;
    	let shipselect;
    	let updating_ships_1;
    	let updating_selectedShip_1;
    	let t21;
    	let hr0;
    	let t22;
    	let placementoption;
    	let t23;
    	let hr1;
    	let t24;
    	let orientationbtn;
    	let updating_orientation;
    	let t25;
    	let grid1;
    	let updating_ships_2;
    	let t26;
    	let startnew;
    	let t27;
    	let show_if = /*winner*/ ctx[12]();
    	let current;

    	function grid0_selectedShip_binding(value) {
    		/*grid0_selectedShip_binding*/ ctx[19](value);
    	}

    	function grid0_hasOverlap_binding(value) {
    		/*grid0_hasOverlap_binding*/ ctx[20](value);
    	}

    	function grid0_ships_binding(value) {
    		/*grid0_ships_binding*/ ctx[21](value);
    	}

    	let grid0_props = {
    		ref: /*state*/ ctx[0] == "placement" ? "grid-1" : "grid-2",
    		orientation: /*orientation*/ ctx[7],
    		guesses: /*opponentGuesses*/ ctx[5],
    		state: /*state*/ ctx[0]
    	};

    	if (/*selectedShip*/ ctx[6] !== void 0) {
    		grid0_props.selectedShip = /*selectedShip*/ ctx[6];
    	}

    	if (/*hasOverlap*/ ctx[8] !== void 0) {
    		grid0_props.hasOverlap = /*hasOverlap*/ ctx[8];
    	}

    	if (/*playerShips*/ ctx[2] !== void 0) {
    		grid0_props.ships = /*playerShips*/ ctx[2];
    	}

    	grid0 = new Grid({ props: grid0_props, $$inline: true });
    	/*grid0_binding*/ ctx[18](grid0);
    	binding_callbacks.push(() => bind(grid0, "selectedShip", grid0_selectedShip_binding));
    	binding_callbacks.push(() => bind(grid0, "hasOverlap", grid0_hasOverlap_binding));
    	binding_callbacks.push(() => bind(grid0, "ships", grid0_ships_binding));

    	function shipselect_ships_binding(value) {
    		/*shipselect_ships_binding*/ ctx[22](value);
    	}

    	function shipselect_selectedShip_binding(value) {
    		/*shipselect_selectedShip_binding*/ ctx[23](value);
    	}

    	let shipselect_props = {};

    	if (/*playerShips*/ ctx[2] !== void 0) {
    		shipselect_props.ships = /*playerShips*/ ctx[2];
    	}

    	if (/*selectedShip*/ ctx[6] !== void 0) {
    		shipselect_props.selectedShip = /*selectedShip*/ ctx[6];
    	}

    	shipselect = new ShipSelect({ props: shipselect_props, $$inline: true });
    	binding_callbacks.push(() => bind(shipselect, "ships", shipselect_ships_binding));
    	binding_callbacks.push(() => bind(shipselect, "selectedShip", shipselect_selectedShip_binding));

    	placementoption = new PlacementOptions({
    			props: { state: /*state*/ ctx[0] },
    			$$inline: true
    		});

    	placementoption.$on("clear", /*clear_handler*/ ctx[24]);
    	placementoption.$on("random", /*random_handler*/ ctx[25]);

    	function orientationbtn_orientation_binding(value) {
    		/*orientationbtn_orientation_binding*/ ctx[26](value);
    	}

    	let orientationbtn_props = {};

    	if (/*orientation*/ ctx[7] !== void 0) {
    		orientationbtn_props.orientation = /*orientation*/ ctx[7];
    	}

    	orientationbtn = new OrientationBtn({
    			props: orientationbtn_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(orientationbtn, "orientation", orientationbtn_orientation_binding));

    	function grid1_ships_binding(value) {
    		/*grid1_ships_binding*/ ctx[28](value);
    	}

    	let grid1_props = {
    		ref: /*state*/ ctx[0] == "placement" ? "grid-2" : "grid-1",
    		state: /*state*/ ctx[0],
    		hideShips: true,
    		guesses: /*playerGuesses*/ ctx[4],
    		activePlayer: /*activePlayer*/ ctx[1]
    	};

    	if (/*opponentShips*/ ctx[3] !== void 0) {
    		grid1_props.ships = /*opponentShips*/ ctx[3];
    	}

    	grid1 = new Grid({ props: grid1_props, $$inline: true });
    	/*grid1_binding*/ ctx[27](grid1);
    	binding_callbacks.push(() => bind(grid1, "ships", grid1_ships_binding));
    	grid1.$on("turn", /*turn_handler*/ ctx[29]);

    	startnew = new StartNew({
    			props: {
    				ref: "startNew",
    				canStartGame: /*canStartGame*/ ctx[11],
    				state: /*state*/ ctx[0]
    			},
    			$$inline: true
    		});

    	startnew.$on("start", /*start_handler*/ ctx[30]);
    	startnew.$on("newGame", /*newGame_handler*/ ctx[31]);
    	let if_block = show_if && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "B";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "A";
    			t3 = space();
    			h12 = element("h1");
    			h12.textContent = "T";
    			t5 = space();
    			h13 = element("h1");
    			h13.textContent = "T";
    			t7 = space();
    			h14 = element("h1");
    			h14.textContent = "L";
    			t9 = space();
    			h15 = element("h1");
    			h15.textContent = "E";
    			t11 = space();
    			h16 = element("h1");
    			h16.textContent = "S";
    			t13 = space();
    			h17 = element("h1");
    			h17.textContent = "H";
    			t15 = space();
    			h18 = element("h1");
    			h18.textContent = "I";
    			t17 = space();
    			h19 = element("h1");
    			h19.textContent = "P";
    			t19 = space();
    			div2 = element("div");
    			create_component(grid0.$$.fragment);
    			t20 = space();
    			div1 = element("div");
    			create_component(shipselect.$$.fragment);
    			t21 = space();
    			hr0 = element("hr");
    			t22 = space();
    			create_component(placementoption.$$.fragment);
    			t23 = space();
    			hr1 = element("hr");
    			t24 = space();
    			create_component(orientationbtn.$$.fragment);
    			t25 = space();
    			create_component(grid1.$$.fragment);
    			t26 = space();
    			create_component(startnew.$$.fragment);
    			t27 = space();
    			if (if_block) if_block.c();
    			add_location(h10, file$6, 179, 8, 5313);
    			add_location(h11, file$6, 180, 8, 5333);
    			add_location(h12, file$6, 181, 8, 5353);
    			add_location(h13, file$6, 182, 8, 5373);
    			add_location(h14, file$6, 183, 8, 5393);
    			add_location(h15, file$6, 184, 8, 5413);
    			add_location(h16, file$6, 185, 8, 5433);
    			add_location(h17, file$6, 186, 8, 5453);
    			add_location(h18, file$6, 187, 8, 5473);
    			add_location(h19, file$6, 188, 8, 5493);
    			attr_dev(div0, "id", "title");
    			attr_dev(div0, "class", "svelte-qzsom");
    			add_location(div0, file$6, 178, 4, 5287);
    			add_location(hr0, file$6, 202, 8, 5938);
    			add_location(hr1, file$6, 205, 8, 6093);
    			attr_dev(div1, "id", "ship-placement");
    			attr_dev(div1, "class", "svelte-qzsom");
    			toggle_class(div1, "disable", /*state*/ ctx[0] == "game");
    			add_location(div1, file$6, 200, 4, 5804);
    			attr_dev(div2, "id", "game-container");
    			attr_dev(div2, "class", "svelte-qzsom");
    			add_location(div2, file$6, 190, 0, 5517);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h10);
    			append_dev(div0, t1);
    			append_dev(div0, h11);
    			append_dev(div0, t3);
    			append_dev(div0, h12);
    			append_dev(div0, t5);
    			append_dev(div0, h13);
    			append_dev(div0, t7);
    			append_dev(div0, h14);
    			append_dev(div0, t9);
    			append_dev(div0, h15);
    			append_dev(div0, t11);
    			append_dev(div0, h16);
    			append_dev(div0, t13);
    			append_dev(div0, h17);
    			append_dev(div0, t15);
    			append_dev(div0, h18);
    			append_dev(div0, t17);
    			append_dev(div0, h19);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(grid0, div2, null);
    			append_dev(div2, t20);
    			append_dev(div2, div1);
    			mount_component(shipselect, div1, null);
    			append_dev(div1, t21);
    			append_dev(div1, hr0);
    			append_dev(div1, t22);
    			mount_component(placementoption, div1, null);
    			append_dev(div1, t23);
    			append_dev(div1, hr1);
    			append_dev(div1, t24);
    			mount_component(orientationbtn, div1, null);
    			append_dev(div2, t25);
    			mount_component(grid1, div2, null);
    			append_dev(div2, t26);
    			mount_component(startnew, div2, null);
    			append_dev(div2, t27);
    			if (if_block) if_block.m(div2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const grid0_changes = {};
    			if (dirty[0] & /*state*/ 1) grid0_changes.ref = /*state*/ ctx[0] == "placement" ? "grid-1" : "grid-2";
    			if (dirty[0] & /*orientation*/ 128) grid0_changes.orientation = /*orientation*/ ctx[7];
    			if (dirty[0] & /*opponentGuesses*/ 32) grid0_changes.guesses = /*opponentGuesses*/ ctx[5];
    			if (dirty[0] & /*state*/ 1) grid0_changes.state = /*state*/ ctx[0];

    			if (!updating_selectedShip && dirty[0] & /*selectedShip*/ 64) {
    				updating_selectedShip = true;
    				grid0_changes.selectedShip = /*selectedShip*/ ctx[6];
    				add_flush_callback(() => updating_selectedShip = false);
    			}

    			if (!updating_hasOverlap && dirty[0] & /*hasOverlap*/ 256) {
    				updating_hasOverlap = true;
    				grid0_changes.hasOverlap = /*hasOverlap*/ ctx[8];
    				add_flush_callback(() => updating_hasOverlap = false);
    			}

    			if (!updating_ships && dirty[0] & /*playerShips*/ 4) {
    				updating_ships = true;
    				grid0_changes.ships = /*playerShips*/ ctx[2];
    				add_flush_callback(() => updating_ships = false);
    			}

    			grid0.$set(grid0_changes);
    			const shipselect_changes = {};

    			if (!updating_ships_1 && dirty[0] & /*playerShips*/ 4) {
    				updating_ships_1 = true;
    				shipselect_changes.ships = /*playerShips*/ ctx[2];
    				add_flush_callback(() => updating_ships_1 = false);
    			}

    			if (!updating_selectedShip_1 && dirty[0] & /*selectedShip*/ 64) {
    				updating_selectedShip_1 = true;
    				shipselect_changes.selectedShip = /*selectedShip*/ ctx[6];
    				add_flush_callback(() => updating_selectedShip_1 = false);
    			}

    			shipselect.$set(shipselect_changes);
    			const placementoption_changes = {};
    			if (dirty[0] & /*state*/ 1) placementoption_changes.state = /*state*/ ctx[0];
    			placementoption.$set(placementoption_changes);
    			const orientationbtn_changes = {};

    			if (!updating_orientation && dirty[0] & /*orientation*/ 128) {
    				updating_orientation = true;
    				orientationbtn_changes.orientation = /*orientation*/ ctx[7];
    				add_flush_callback(() => updating_orientation = false);
    			}

    			orientationbtn.$set(orientationbtn_changes);

    			if (dirty[0] & /*state*/ 1) {
    				toggle_class(div1, "disable", /*state*/ ctx[0] == "game");
    			}

    			const grid1_changes = {};
    			if (dirty[0] & /*state*/ 1) grid1_changes.ref = /*state*/ ctx[0] == "placement" ? "grid-2" : "grid-1";
    			if (dirty[0] & /*state*/ 1) grid1_changes.state = /*state*/ ctx[0];
    			if (dirty[0] & /*playerGuesses*/ 16) grid1_changes.guesses = /*playerGuesses*/ ctx[4];
    			if (dirty[0] & /*activePlayer*/ 2) grid1_changes.activePlayer = /*activePlayer*/ ctx[1];

    			if (!updating_ships_2 && dirty[0] & /*opponentShips*/ 8) {
    				updating_ships_2 = true;
    				grid1_changes.ships = /*opponentShips*/ ctx[3];
    				add_flush_callback(() => updating_ships_2 = false);
    			}

    			grid1.$set(grid1_changes);
    			const startnew_changes = {};
    			if (dirty[0] & /*canStartGame*/ 2048) startnew_changes.canStartGame = /*canStartGame*/ ctx[11];
    			if (dirty[0] & /*state*/ 1) startnew_changes.state = /*state*/ ctx[0];
    			startnew.$set(startnew_changes);
    			if (dirty[0] & /*winner*/ 4096) show_if = /*winner*/ ctx[12]();

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*winner*/ 4096) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid0.$$.fragment, local);
    			transition_in(shipselect.$$.fragment, local);
    			transition_in(placementoption.$$.fragment, local);
    			transition_in(orientationbtn.$$.fragment, local);
    			transition_in(grid1.$$.fragment, local);
    			transition_in(startnew.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid0.$$.fragment, local);
    			transition_out(shipselect.$$.fragment, local);
    			transition_out(placementoption.$$.fragment, local);
    			transition_out(orientationbtn.$$.fragment, local);
    			transition_out(grid1.$$.fragment, local);
    			transition_out(startnew.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div2);
    			/*grid0_binding*/ ctx[18](null);
    			destroy_component(grid0);
    			destroy_component(shipselect);
    			destroy_component(placementoption);
    			destroy_component(orientationbtn);
    			/*grid1_binding*/ ctx[27](null);
    			destroy_component(grid1);
    			destroy_component(startnew);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let numOfShipsPlaced;
    	let canStartGame;
    	let winner;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let states = ["placement", "game"];
    	let state = states[0];
    	let activePlayer = "player";

    	// prettier-ignore
    	let playerShips = [
    		{
    			type: "carrier",
    			size: 5,
    			hits: [],
    			pos: []
    		},
    		{
    			type: "battleship",
    			size: 4,
    			hits: [],
    			pos: []
    		},
    		{
    			type: "cruiser",
    			size: 3,
    			hits: [],
    			pos: []
    		},
    		{
    			type: "submarine",
    			size: 3,
    			hits: [],
    			pos: []
    		},
    		{
    			type: "destroyer",
    			size: 2,
    			hits: [],
    			pos: []
    		}
    	];

    	let opponentShips = [
    		{
    			type: "carrier",
    			size: 5,
    			hits: [],
    			pos: []
    		},
    		{
    			type: "battleship",
    			size: 4,
    			hits: [],
    			pos: []
    		},
    		{
    			type: "cruiser",
    			size: 3,
    			hits: [],
    			pos: []
    		},
    		{
    			type: "submarine",
    			size: 3,
    			hits: [],
    			pos: []
    		},
    		{
    			type: "destroyer",
    			size: 2,
    			hits: [],
    			pos: []
    		}
    	];

    	let playerGuesses = { hits: [], misses: [] };
    	let opponentGuesses = { hits: [], misses: [] };
    	let opponentPossibleGuesses = [];
    	createGuesses();

    	function createGuesses() {
    		for (let y = 0; y < 10; y++) {
    			for (let x = 0; x < 10; x++) {
    				opponentPossibleGuesses = [...opponentPossibleGuesses, `${x}${y}`];
    			}
    		}
    	}

    	let selectedShip = null;
    	let orientation = "horizontal";
    	let hasOverlap = false;
    	let playerGridEl;
    	let opponentGridEl;
    	let messagesEl;

    	function reset() {
    		$$invalidate(0, state = states[0]);

    		$$invalidate(2, playerShips = [
    			{
    				type: "carrier",
    				size: 5,
    				hits: [],
    				pos: []
    			},
    			{
    				type: "battleship",
    				size: 4,
    				hits: [],
    				pos: []
    			},
    			{
    				type: "cruiser",
    				size: 3,
    				hits: [],
    				pos: []
    			},
    			{
    				type: "submarine",
    				size: 3,
    				hits: [],
    				pos: []
    			},
    			{
    				type: "destroyer",
    				size: 2,
    				hits: [],
    				pos: []
    			}
    		]);

    		$$invalidate(3, opponentShips = [
    			{
    				type: "carrier",
    				size: 5,
    				hits: [],
    				pos: []
    			},
    			{
    				type: "battleship",
    				size: 4,
    				hits: [],
    				pos: []
    			},
    			{
    				type: "cruiser",
    				size: 3,
    				hits: [],
    				pos: []
    			},
    			{
    				type: "submarine",
    				size: 3,
    				hits: [],
    				pos: []
    			},
    			{
    				type: "destroyer",
    				size: 2,
    				hits: [],
    				pos: []
    			}
    		]);

    		$$invalidate(4, playerGuesses = { hits: [], misses: [] });
    		$$invalidate(5, opponentGuesses = { hits: [], misses: [] });
    	}

    	function clearShips() {
    		$$invalidate(2, playerShips = playerShips.map(s => {
    			return { ...s, pos: [] };
    		}));
    	}

    	function handleStart() {
    		if (canStartGame) {
    			$$invalidate(0, state = states[1]);
    			opponentGridEl.placeRandom();
    		}

    		messagesEl.startGameMsg(canStartGame);
    	}

    	function opponentTurn() {
    		let randIndex = Math.floor(Math.random() * opponentPossibleGuesses.length);
    		let randPos = opponentPossibleGuesses.splice(randIndex, 1)[0];
    		let hit = false;

    		playerShips.forEach((s, i) => {
    			if (s.pos.includes(randPos)) {
    				$$invalidate(2, playerShips[i] = { ...s, hits: [...s.hits, randPos] }, playerShips);
    				hit = true;
    			}
    		});

    		if (!hit) $$invalidate(5, opponentGuesses = {
    			...opponentGuesses,
    			misses: [...opponentGuesses.misses, randPos]
    		});

    		$$invalidate(1, activePlayer = "player");
    	}

    	function handleTurn(e) {
    		$$invalidate(4, playerGuesses = e.guesses);
    		$$invalidate(1, activePlayer = e.activePlayer);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function grid0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			playerGridEl = $$value;
    			$$invalidate(9, playerGridEl);
    		});
    	}

    	function grid0_selectedShip_binding(value) {
    		selectedShip = value;
    		$$invalidate(6, selectedShip);
    	}

    	function grid0_hasOverlap_binding(value) {
    		hasOverlap = value;
    		$$invalidate(8, hasOverlap);
    	}

    	function grid0_ships_binding(value) {
    		playerShips = value;
    		$$invalidate(2, playerShips);
    	}

    	function shipselect_ships_binding(value) {
    		playerShips = value;
    		$$invalidate(2, playerShips);
    	}

    	function shipselect_selectedShip_binding(value) {
    		selectedShip = value;
    		$$invalidate(6, selectedShip);
    	}

    	const clear_handler = () => clearShips();
    	const random_handler = () => playerGridEl.placeRandom();

    	function orientationbtn_orientation_binding(value) {
    		orientation = value;
    		$$invalidate(7, orientation);
    	}

    	function grid1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			opponentGridEl = $$value;
    			$$invalidate(10, opponentGridEl);
    		});
    	}

    	function grid1_ships_binding(value) {
    		opponentShips = value;
    		$$invalidate(3, opponentShips);
    	}

    	const turn_handler = e => handleTurn(e.detail);
    	const start_handler = () => handleStart();
    	const newGame_handler = () => reset();

    	$$self.$capture_state = () => ({
    		Grid,
    		ShipSelect,
    		PlacementOption: PlacementOptions,
    		OrientationBtn,
    		StartNew,
    		WonLost,
    		states,
    		state,
    		activePlayer,
    		playerShips,
    		opponentShips,
    		playerGuesses,
    		opponentGuesses,
    		opponentPossibleGuesses,
    		createGuesses,
    		selectedShip,
    		orientation,
    		hasOverlap,
    		playerGridEl,
    		opponentGridEl,
    		messagesEl,
    		reset,
    		clearShips,
    		handleStart,
    		opponentTurn,
    		handleTurn,
    		numOfShipsPlaced,
    		canStartGame,
    		winner
    	});

    	$$self.$inject_state = $$props => {
    		if ("states" in $$props) states = $$props.states;
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    		if ("activePlayer" in $$props) $$invalidate(1, activePlayer = $$props.activePlayer);
    		if ("playerShips" in $$props) $$invalidate(2, playerShips = $$props.playerShips);
    		if ("opponentShips" in $$props) $$invalidate(3, opponentShips = $$props.opponentShips);
    		if ("playerGuesses" in $$props) $$invalidate(4, playerGuesses = $$props.playerGuesses);
    		if ("opponentGuesses" in $$props) $$invalidate(5, opponentGuesses = $$props.opponentGuesses);
    		if ("opponentPossibleGuesses" in $$props) opponentPossibleGuesses = $$props.opponentPossibleGuesses;
    		if ("selectedShip" in $$props) $$invalidate(6, selectedShip = $$props.selectedShip);
    		if ("orientation" in $$props) $$invalidate(7, orientation = $$props.orientation);
    		if ("hasOverlap" in $$props) $$invalidate(8, hasOverlap = $$props.hasOverlap);
    		if ("playerGridEl" in $$props) $$invalidate(9, playerGridEl = $$props.playerGridEl);
    		if ("opponentGridEl" in $$props) $$invalidate(10, opponentGridEl = $$props.opponentGridEl);
    		if ("messagesEl" in $$props) messagesEl = $$props.messagesEl;
    		if ("numOfShipsPlaced" in $$props) $$invalidate(17, numOfShipsPlaced = $$props.numOfShipsPlaced);
    		if ("canStartGame" in $$props) $$invalidate(11, canStartGame = $$props.canStartGame);
    		if ("winner" in $$props) $$invalidate(12, winner = $$props.winner);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*playerShips*/ 4) {
    			$$invalidate(17, numOfShipsPlaced = playerShips.filter(s => s.pos.length > 1).length);
    		}

    		if ($$self.$$.dirty[0] & /*numOfShipsPlaced, state*/ 131073) {
    			$$invalidate(11, canStartGame = numOfShipsPlaced == 5 && state == "placement"
    			? true
    			: false);
    		}

    		if ($$self.$$.dirty[0] & /*playerShips, opponentShips*/ 12) {
    			$$invalidate(12, winner = () => {
    				if (playerShips.map(s => s.hits).flat().length == 17) {
    					return "opponent";
    				} else if (opponentShips.map(s => s.hits).flat().length == 17) {
    					return "player";
    				}
    			});
    		}

    		if ($$self.$$.dirty[0] & /*activePlayer*/ 2) {
    			if (activePlayer == "opponent") setTimeout(() => opponentTurn(), 1000);
    		}
    	};

    	return [
    		state,
    		activePlayer,
    		playerShips,
    		opponentShips,
    		playerGuesses,
    		opponentGuesses,
    		selectedShip,
    		orientation,
    		hasOverlap,
    		playerGridEl,
    		opponentGridEl,
    		canStartGame,
    		winner,
    		reset,
    		clearShips,
    		handleStart,
    		handleTurn,
    		numOfShipsPlaced,
    		grid0_binding,
    		grid0_selectedShip_binding,
    		grid0_hasOverlap_binding,
    		grid0_ships_binding,
    		shipselect_ships_binding,
    		shipselect_selectedShip_binding,
    		clear_handler,
    		random_handler,
    		orientationbtn_orientation_binding,
    		grid1_binding,
    		grid1_ships_binding,
    		turn_handler,
    		start_handler,
    		newGame_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
