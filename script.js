(function () {
    "use strict";

    /* =========================================================
       0. CONFIG
    ========================================================= */
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

    var GH_FONT_BASE = "https://cdn.jsdelivr.net/gh/google/fonts@main/";

    // NOTE: "Helvetica (Standar)" was removed per product decision — Inter is now
    // the default font and also the universal fallback when a Google Font fetch fails,
    // so the export path never falls back to Helvetica and never surfaces an error.
    var FONTS = [
        { key: "times", label: "Times New Roman (Standar)", css: "'Times New Roman', Times, serif", google: null, std: "TimesRoman", stdBold: "TimesRomanBold" },
        { key: "courier", label: "Courier (Standar)", css: "'Courier New', Courier, monospace", google: null, std: "Courier", stdBold: "CourierBold" },
        { key: "inter", label: "Inter", css: "'Inter', sans-serif", google: "Inter", file: "ofl/inter/static/Inter-Regular.ttf", fileBold: "ofl/inter/static/Inter-Bold.ttf" },
        { key: "plusjakarta", label: "Plus Jakarta Sans", css: "'Plus Jakarta Sans', sans-serif", google: "Plus Jakarta Sans", file: "ofl/plusjakartasans/static/PlusJakartaSans-Regular.ttf", fileBold: "ofl/plusjakartasans/static/PlusJakartaSans-Bold.ttf" },
        { key: "poppins", label: "Poppins", css: "'Poppins', sans-serif", google: "Poppins", file: "ofl/poppins/Poppins-Regular.ttf", fileBold: "ofl/poppins/Poppins-Bold.ttf" },
        { key: "plexsans", label: "IBM Plex Sans", css: "'IBM Plex Sans', sans-serif", google: "IBM Plex Sans", file: "ofl/ibmplexsans/IBMPlexSans-Regular.ttf", fileBold: "ofl/ibmplexsans/IBMPlexSans-Bold.ttf" },
        { key: "plexmono", label: "IBM Plex Mono", css: "'IBM Plex Mono', monospace", google: "IBM Plex Mono", file: "ofl/ibmplexmono/IBMPlexMono-Regular.ttf", fileBold: "ofl/ibmplexmono/IBMPlexMono-Bold.ttf" },
        { key: "fraunces", label: "Fraunces", css: "'Fraunces', serif", google: "Fraunces", file: "ofl/fraunces/static/Fraunces_144pt-Regular.ttf", fileBold: "ofl/fraunces/static/Fraunces_144pt-Bold.ttf" },
        { key: "roboto", label: "Roboto", css: "'Roboto', sans-serif", google: "Roboto", file: "apache/roboto/static/Roboto-Regular.ttf", fileBold: "apache/roboto/static/Roboto-Bold.ttf" },
        { key: "montserrat", label: "Montserrat", css: "'Montserrat', sans-serif", google: "Montserrat", file: "ofl/montserrat/static/Montserrat-Regular.ttf", fileBold: "ofl/montserrat/static/Montserrat-Bold.ttf" },
        { key: "merriweather", label: "Merriweather", css: "'Merriweather', serif", google: "Merriweather", file: "ofl/merriweather/static/Merriweather-Regular.ttf", fileBold: "ofl/merriweather/static/Merriweather-Bold.ttf" },
        { key: "lora", label: "Lora", css: "'Lora', serif", google: "Lora", file: "ofl/lora/static/Lora-Regular.ttf", fileBold: "ofl/lora/static/Lora-Bold.ttf" },
        { key: "playfair", label: "Playfair Display", css: "'Playfair Display', serif", google: "Playfair Display", file: "ofl/playfairdisplay/static/PlayfairDisplay-Regular.ttf", fileBold: "ofl/playfairdisplay/static/PlayfairDisplay-Bold.ttf" },
        { key: "sourcesans", label: "Source Sans 3", css: "'Source Sans 3', sans-serif", google: "Source Sans 3", file: "ofl/sourcesans3/static/SourceSans3-Regular.ttf", fileBold: "ofl/sourcesans3/static/SourceSans3-Bold.ttf" },
        { key: "spacemono", label: "Space Mono", css: "'Space Mono', monospace", google: "Space Mono", file: "ofl/spacemono/SpaceMono-Regular.ttf", fileBold: "ofl/spacemono/SpaceMono-Bold.ttf" },
        { key: "caveat", label: "Caveat (gaya tanda tangan)", css: "'Caveat', cursive", google: "Caveat", file: "ofl/caveat/static/Caveat-Regular.ttf", fileBold: "ofl/caveat/static/Caveat-Bold.ttf" },
        { key: "dancing", label: "Dancing Script (gaya tanda tangan)", css: "'Dancing Script', cursive", google: "Dancing Script", file: "ofl/dancingscript/static/DancingScript-Regular.ttf", fileBold: "ofl/dancingscript/static/DancingScript-Bold.ttf" },
        { key: "pacifico", label: "Pacifico (gaya tanda tangan)", css: "'Pacifico', cursive", google: "Pacifico", file: "ofl/pacifico/Pacifico-Regular.ttf", fileBold: "ofl/pacifico/Pacifico-Regular.ttf" },
        { key: "courierprime", label: "Courier Prime", css: "'Courier Prime', monospace", google: "Courier Prime", file: "ofl/courierprime/CourierPrime-Regular.ttf", fileBold: "ofl/courierprime/CourierPrime-Bold.ttf" },
    ];

    var PAPER_SIZES = {
        a4: { w: 595.28, h: 841.89, label: "A4" },
        letter: { w: 612, h: 792, label: "Letter" },
        legal: { w: 612, h: 1008, label: "Legal" },
        f4: { w: 595.28, h: 935.43, label: "F4" },
    };

    var DEFAULT_FONT_KEY = "inter";

    /* =========================================================
       1. STATE
    ========================================================= */
    var state = {
        tool: "select",
        zoomFactor: 1,
        sourcePdfBytes: null,
        pages: [],
        selected: null, // {pageId, elId}
        placingSignature: null, // {dataUrl, aspect}
        placingImage: null, // {dataUrl, aspect}
        blankSizeKey: "a4",
        boldActive: false,
        sidebarCollapsed: false,
        sidebarMobileOpen: false,
    };

    var pageCounter = 0;
    var elCounter = 0;

    function uid(prefix) {
        return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
    }

    function isMobileViewport() {
        return window.innerWidth <= 1024;
    }

    /* =========================================================
       2. DOM REFS
    ========================================================= */
    var $ = function (id) { return document.getElementById(id); };

    var landingPage = $("landingPage");
    var editorPage = $("editorPage");
    var pagesContainer = $("pagesContainer");
    var pageThumbsList = $("pageThumbsList");
    var emptyState = $("emptyState");
    var canvasScrollArea = $("canvasScrollArea");
    var toastEl = $("toast");
    var fontFamilySelect = $("fontFamilySelect");
    var fontSizeSelect = $("fontSizeSelect");
    var textColorInput = $("textColorInput");
    var boldBtn = $("boldBtn");
    var sigColorInput = $("sigColorInput");
    var brushSizeInput = $("brushSizeInput");
    var signaturePadDock = $("signaturePadDock");
    var signaturePadCanvas = $("signaturePadCanvas");
    var blankPaperSizeSelect = $("blankPaperSizeSelect");
    var pageSidebar = $("pageSidebar");
    var sidebarOverlay = $("sidebarOverlay");
    var imageFileInput = $("imageFileInput");
    var undoBtn = $("undoBtn");
    var redoBtn = $("redoBtn");

    /* =========================================================
       3. UTIL
    ========================================================= */
    var toastTimer = null;
    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.remove("opacity-0", "translate-y-20");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toastEl.classList.add("opacity-0", "translate-y-20");
        }, 2800);
    }

    function hexToRgb01(hex) {
        hex = (hex || "#000000").replace("#", "");
        if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
        return [
            parseInt(hex.substring(0, 2), 16) / 255,
            parseInt(hex.substring(2, 4), 16) / 255,
            parseInt(hex.substring(4, 6), 16) / 255,
        ];
    }

    function dataUrlToUint8(dataUrl) {
        var base64 = dataUrl.split(",")[1];
        var bin = atob(base64);
        var arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return arr;
    }

    function downloadBlob(bytes, filename) {
        var blob = new Blob([bytes], { type: "application/pdf" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    }

    function fontDefByKey(key) {
        return FONTS.find(function (f) { return f.key === key; }) || fontDefByKey(DEFAULT_FONT_KEY);
    }

    function readFileAsDataUrl(file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function (e) { resolve(e.target.result); };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function loadImageDims(dataUrl) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.onload = function () { resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    /* =========================================================
       4. UNDO / REDO (command pattern)
    ========================================================= */
    var history = { undo: [], redo: [] };

    function updateUndoRedoButtons() {
        undoBtn.disabled = history.undo.length === 0;
        redoBtn.disabled = history.redo.length === 0;
    }

    // Record an already-applied change: pass functions that (re)apply it.
    function pushHistory(entry) {
        history.undo.push(entry);
        history.redo = [];
        updateUndoRedoButtons();
    }

    function doUndo() {
        var entry = history.undo.pop();
        if (!entry) return;
        entry.undo();
        history.redo.push(entry);
        updateUndoRedoButtons();
    }

    function doRedo() {
        var entry = history.redo.pop();
        if (!entry) return;
        entry.redo();
        history.undo.push(entry);
        updateUndoRedoButtons();
    }

    undoBtn.addEventListener("click", doUndo);
    redoBtn.addEventListener("click", doRedo);

    document.addEventListener("keydown", function (e) {
        var editingText = document.activeElement && document.activeElement.getAttribute &&
            document.activeElement.getAttribute("contenteditable") === "true";
        if (editingText) return;
        var mod = e.ctrlKey || e.metaKey;
        if (mod && !e.shiftKey && e.key.toLowerCase() === "z") { e.preventDefault(); doUndo(); }
        else if (mod && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); doRedo(); }
    });

    function findPage(pageId) {
        return state.pages.find(function (p) { return p.id === pageId; });
    }
    function findEl(page, elId) {
        return page.elements.find(function (x) { return x.id === elId; });
    }

    /* =========================================================
       5. INIT UI (font & paper selects)
    ========================================================= */
    function populateSelects() {
        FONTS.forEach(function (f) {
            var o1 = document.createElement("option");
            o1.value = f.key; o1.textContent = f.label; o1.style.fontFamily = f.css;
            fontFamilySelect.appendChild(o1);
        });
        fontFamilySelect.value = DEFAULT_FONT_KEY;

        Object.keys(PAPER_SIZES).forEach(function (key) {
            var o = document.createElement("option");
            o.value = key; o.textContent = PAPER_SIZES[key].label;
            blankPaperSizeSelect.appendChild(o);
        });
    }

    /* =========================================================
       6. LANDING <-> EDITOR NAV
    ========================================================= */
    function openEditor() {
        landingPage.classList.add("hidden");
        editorPage.classList.remove("hidden");
    }
    ["ctaTop", "ctaMain", "ctaBottom"].forEach(function (id) {
        $(id).addEventListener("click", openEditor);
    });
    $("backToLanding").addEventListener("click", function () {
        editorPage.classList.add("hidden");
        landingPage.classList.remove("hidden");
    });

    /* =========================================================
       7. SIDEBAR COLLAPSE (desktop + mobile)
    ========================================================= */
    function updateSidebarUI() {
        if (isMobileViewport()) {
            pageSidebar.classList.remove("collapsed");
            pageSidebar.classList.toggle("mobile-open", state.sidebarMobileOpen);
            sidebarOverlay.classList.toggle("show", state.sidebarMobileOpen);
        } else {
            pageSidebar.classList.remove("mobile-open");
            sidebarOverlay.classList.remove("show");
            pageSidebar.classList.toggle("collapsed", state.sidebarCollapsed);
        }
    }

    $("sidebarToggleBtn").addEventListener("click", function () {
        if (isMobileViewport()) {
            state.sidebarMobileOpen = !state.sidebarMobileOpen;
        } else {
            state.sidebarCollapsed = !state.sidebarCollapsed;
        }
        updateSidebarUI();
    });
    $("sidebarCloseBtnMobile").addEventListener("click", function () {
        state.sidebarMobileOpen = false;
        updateSidebarUI();
    });
    sidebarOverlay.addEventListener("click", function () {
        state.sidebarMobileOpen = false;
        updateSidebarUI();
    });
    window.addEventListener("resize", updateSidebarUI);
    updateSidebarUI();

    /* =========================================================
       8. TOOLBAR — tool switching
    ========================================================= */
    var toolBtns = document.querySelectorAll(".tool-btn");
    var textToolOptions = $("textToolOptions");
    var signatureToolOptions = $("signatureToolOptions");
    var imageToolOptions = $("imageToolOptions");

    function setTool(name) {
        state.tool = name;
        toolBtns.forEach(function (b) { b.classList.toggle("active", b.dataset.tool === name); });
        textToolOptions.classList.toggle("hidden", name !== "text" && name !== "checkmark");
        signatureToolOptions.classList.toggle("hidden", name !== "signature");
        signatureToolOptions.classList.toggle("flex", name === "signature");
        signaturePadDock.classList.toggle("hidden", name !== "signature");
        imageToolOptions.classList.toggle("hidden", name !== "image");
        imageToolOptions.classList.toggle("flex", name === "image");
        pagesContainer.style.cursor = name === "select" ? "default" : "crosshair";
        if (name !== "signature") state.placingSignature = null;
        if (name !== "image") state.placingImage = null;
    }

    toolBtns.forEach(function (b) {
        b.addEventListener("click", function () {
            setTool(b.dataset.tool);
            if (b.dataset.tool === "image") {
                imageFileInput.click();
            }
        });
    });
    setTool("select");

    boldBtn.addEventListener("click", function () {
        state.boldActive = !state.boldActive;
        boldBtn.classList.toggle("active", state.boldActive);
        applyStyleToSelectedText({ bold: state.boldActive });
    });
    fontFamilySelect.addEventListener("change", function () {
        applyStyleToSelectedText({ fontKey: fontFamilySelect.value });
    });
    fontSizeSelect.addEventListener("change", function () {
        applyStyleToSelectedText({ fontPt: Number(fontSizeSelect.value) });
    });
    textColorInput.addEventListener("input", function () {
        applyStyleToSelectedText({ color: textColorInput.value });
    });

    function applyStyleToSelectedText(patch) {
        var sel = getSelectedElement();
        if (!sel || sel.el.type !== "text") return;
        var el = sel.el;
        var oldVals = {};
        Object.keys(patch).forEach(function (k) { oldVals[k] = el[k]; });
        var oldLineHeight = el.lineHeightPt;

        function apply(vals, lh) {
            Object.assign(el, vals);
            if (vals.fontPt) el.lineHeightPt = vals.fontPt * 1.28;
            else if (lh !== undefined) el.lineHeightPt = lh;
            renderTextElStyle(sel.page, el);
            repositionToolbarFor(el);
        }
        apply(patch);
        pushHistory({
            undo: function () { apply(oldVals, oldLineHeight); syncStylePanelFromEl(el); },
            redo: function () { apply(patch); syncStylePanelFromEl(el); },
        });
    }

    function syncStylePanelFromEl(el) {
        if (!state.selected || state.selected.elId !== el.id) return;
        fontFamilySelect.value = el.fontKey;
        fontSizeSelect.value = String(Math.round(el.fontPt));
        textColorInput.value = el.color;
        state.boldActive = !!el.bold;
        boldBtn.classList.toggle("active", state.boldActive);
    }

    /* =========================================================
       9. ZOOM
    ========================================================= */
    var zoomLabel = $("zoomLabel");
    function setZoom(factor) {
        state.zoomFactor = Math.max(0.4, Math.min(3, factor));
        zoomLabel.textContent = Math.round(state.zoomFactor * 100) + "%";
        state.pages.forEach(renderPageCanvas);
    }
    $("zoomInBtn").addEventListener("click", function () { setZoom(state.zoomFactor * 1.15); });
    $("zoomOutBtn").addEventListener("click", function () { setZoom(state.zoomFactor / 1.15); });

    /* =========================================================
       10. FILE / BLANK PAGE LOADING
    ========================================================= */
    var pdfFileInput = $("pdfFileInput");
    ["uploadPdfBtn", "emptyUploadBtn"].forEach(function (id) {
        $(id).addEventListener("click", function () { pdfFileInput.click(); });
    });
    pdfFileInput.addEventListener("change", function () {
        var file = pdfFileInput.files[0];
        if (file) loadPdfFile(file);
        pdfFileInput.value = "";
    });

    function loadPdfFile(file) {
        if (file.type !== "application/pdf") {
            showToast("File harus berupa PDF.");
            return;
        }
        var reader = new FileReader();
        reader.onload = function (ev) {
            var bytes = new Uint8Array(ev.target.result);
            state.sourcePdfBytes = bytes;
            var loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
            loadingTask.promise
                .then(function (pdf) {
                    var chain = Promise.resolve();
                    var count = pdf.numPages;
                    for (var i = 1; i <= count; i++) {
                        (function (pageNum) {
                            chain = chain.then(function () {
                                return pdf.getPage(pageNum).then(function (pjsPage) {
                                    var vp = pjsPage.getViewport({ scale: 1 });
                                    addPage({
                                        sourcePdfPageIndex: pageNum - 1,
                                        pdfJsPage: pjsPage,
                                        ptWidth: vp.width,
                                        ptHeight: vp.height,
                                    }, true);
                                });
                            });
                        })(i);
                    }
                    return chain;
                })
                .then(function () {
                    showToast("PDF berhasil dimuat (" + state.pages.length + " halaman).");
                    updateEmptyState();
                })
                .catch(function (err) {
                    console.error(err);
                    showToast("Gagal membaca PDF. Pastikan file tidak rusak.");
                });
        };
        reader.readAsArrayBuffer(file);
    }

    function addBlankPageAction(sizeKey) {
        var sz = PAPER_SIZES[sizeKey] || PAPER_SIZES.a4;
        var page = addPage({ sourcePdfPageIndex: null, pdfJsPage: null, ptWidth: sz.w, ptHeight: sz.h }, true);
        updateEmptyState();
        return page;
    }
    $("addBlankPageBtn").addEventListener("click", function () { addBlankPageAction(state.blankSizeKey); });
    $("emptyBlankBtn").addEventListener("click", function () { addBlankPageAction(blankPaperSizeSelect.value); });
    blankPaperSizeSelect.addEventListener("change", function () { state.blankSizeKey = blankPaperSizeSelect.value; });

    function updateEmptyState() {
        emptyState.classList.toggle("hidden", state.pages.length > 0);
    }

    /* =========================================================
       11. PAGE CREATION / RENDERING
    ========================================================= */
    function addPage(opts, recordHistory) {
        pageCounter++;
        var page = {
            id: "p" + pageCounter,
            sourcePdfPageIndex: opts.sourcePdfPageIndex,
            pdfJsPage: opts.pdfJsPage,
            ptWidth: opts.ptWidth,
            ptHeight: opts.ptHeight,
            displayScale: 1,
            elements: [],
        };

        var wrap = document.createElement("div");
        wrap.className = "pdf-page";
        wrap.dataset.pageId = page.id;

        var badge = document.createElement("div");
        badge.className = "page-index-badge";
        wrap.appendChild(badge);
        page.badgeEl = badge;

        var canvas = document.createElement("canvas");
        canvas.className = "page-render-canvas";
        wrap.appendChild(canvas);

        var overlay = document.createElement("div");
        overlay.className = "page-overlay";
        wrap.appendChild(overlay);

        overlay.addEventListener("pointerdown", function (e) {
            if (e.target !== overlay) return;
            handleOverlayClick(page, e);
        });

        pagesContainer.appendChild(wrap);
        page.wrapEl = wrap;
        page.canvasEl = canvas;
        page.overlayEl = overlay;

        state.pages.push(page);
        renumberPages();
        renderPageCanvas(page);
        rebuildThumbList();

        if (recordHistory) {
            pushHistory({
                undo: function () { removePageInternal(page.id); },
                redo: function () { reinsertPage(page); },
            });
        }

        return page;
    }

    function reinsertPage(page) {
        pagesContainer.appendChild(page.wrapEl);
        state.pages.push(page);
        renumberPages();
        rebuildThumbList();
        updateEmptyState();
    }

    function renumberPages() {
        state.pages.forEach(function (p, i) {
            p.badgeEl.textContent = "Halaman " + (i + 1) + " dari " + state.pages.length;
        });
    }

    function computeBaseScale(page) {
        var targetWidthPx = 760;
        return targetWidthPx / page.ptWidth;
    }

    function renderPageCanvas(page) {
        var baseScale = computeBaseScale(page);
        var displayScale = baseScale * state.zoomFactor;
        page.displayScale = displayScale;

        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var cssW = page.ptWidth * displayScale;
        var cssH = page.ptHeight * displayScale;

        page.wrapEl.style.width = cssW + "px";
        page.wrapEl.style.height = cssH + "px";
        page.canvasEl.style.width = cssW + "px";
        page.canvasEl.style.height = cssH + "px";
        page.canvasEl.width = Math.round(cssW * dpr);
        page.canvasEl.height = Math.round(cssH * dpr);

        var ctx = page.canvasEl.getContext("2d");
        if (page.pdfJsPage) {
            var vp = page.pdfJsPage.getViewport({ scale: displayScale * dpr });
            page.pdfJsPage.render({ canvasContext: ctx, viewport: vp }).promise
                .then(function () { rebuildThumbFor(page); })
                .catch(function (e) { console.error("render error", e); });
        } else {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, page.canvasEl.width, page.canvasEl.height);
            rebuildThumbFor(page);
        }
        layoutPageElements(page);
    }

    function layoutPageElements(page) {
        page.elements.forEach(function (el) {
            if (el.type === "text") renderTextElStyle(page, el);
            else renderImageElStyle(page, el);
            repositionToolbarFor(el);
        });
    }

    /* =========================================================
       12. THUMBNAILS / SIDEBAR LIST
    ========================================================= */
    function rebuildThumbList() {
        pageThumbsList.innerHTML = "";
        state.pages.forEach(function (page, idx) {
            var thumb = document.createElement("div");
            thumb.className = "page-thumb";
            thumb.dataset.pageId = page.id;

            var tcanvas = document.createElement("canvas");
            thumb.appendChild(tcanvas);
            page.thumbCanvasEl = tcanvas;

            var label = document.createElement("span");
            label.className = "thumb-label";
            label.textContent = idx + 1;
            thumb.appendChild(label);

            var delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "page-thumb-del";
            delBtn.innerHTML = "&times;";
            delBtn.title = "Hapus halaman ini";
            delBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                removePage(page.id);
            });
            thumb.appendChild(delBtn);

            thumb.addEventListener("click", function () {
                page.wrapEl.scrollIntoView({ behavior: "smooth", block: "start" });
                if (isMobileViewport()) { state.sidebarMobileOpen = false; updateSidebarUI(); }
            });

            pageThumbsList.appendChild(thumb);
            rebuildThumbFor(page);
        });
        setupScrollSpy();
    }

    function rebuildThumbFor(page) {
        if (!page.thumbCanvasEl) return;
        var tw = 100;
        var th = tw * (page.ptHeight / page.ptWidth);
        page.thumbCanvasEl.width = tw;
        page.thumbCanvasEl.height = th;
        var tctx = page.thumbCanvasEl.getContext("2d");
        tctx.fillStyle = "#fff";
        tctx.fillRect(0, 0, tw, th);
        try { tctx.drawImage(page.canvasEl, 0, 0, tw, th); } catch (e) { }
    }

    var scrollSpyObserver = null;
    function setupScrollSpy() {
        if (scrollSpyObserver) scrollSpyObserver.disconnect();
        scrollSpyObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var pid = entry.target.dataset.pageId;
                        document.querySelectorAll(".page-thumb").forEach(function (t) {
                            t.classList.toggle("active", t.dataset.pageId === pid);
                        });
                    }
                });
            },
            { root: canvasScrollArea, threshold: 0.5 }
        );
        state.pages.forEach(function (p) { scrollSpyObserver.observe(p.wrapEl); });
    }

    function removePageInternal(pageId) {
        var idx = state.pages.findIndex(function (p) { return p.id === pageId; });
        if (idx === -1) return null;
        var page = state.pages[idx];
        page.wrapEl.remove();
        state.pages.splice(idx, 1);
        if (state.selected && state.selected.pageId === pageId) deselectAll();
        renumberPages();
        rebuildThumbList();
        updateEmptyState();
        return page;
    }

    function removePage(pageId) {
        var page = removePageInternal(pageId);
        if (!page) return;
        pushHistory({
            undo: function () { reinsertPage(page); },
            redo: function () { removePageInternal(page.id); },
        });
    }

    /* =========================================================
       13. OVERLAY CLICK -> CREATE ELEMENTS
    ========================================================= */
    function clickToPagePt(page, e) {
        var rect = page.canvasEl.getBoundingClientRect();
        var xPx = e.clientX - rect.left;
        var yPx = e.clientY - rect.top;
        return { xPt: xPx / page.displayScale, yPt: yPx / page.displayScale };
    }

    function handleOverlayClick(page, e) {
        var pt = clickToPagePt(page, e);
        if (state.tool === "text") {
            createTextElement(page, pt.xPt, pt.yPt, "", true, true);
        } else if (state.tool === "checkmark") {
            createTextElement(page, pt.xPt, pt.yPt, "\u2713", false, true);
        } else if (state.tool === "signature") {
            if (state.placingSignature) {
                placeSignatureAt(page, pt.xPt, pt.yPt, state.placingSignature);
                state.placingSignature = null;
                showToast("Tanda tangan ditempatkan. Seret untuk mengatur posisi.");
            } else {
                showToast('Gambar tanda tangan di panel bawah, lalu klik "Tempel ke PDF".');
            }
        } else if (state.tool === "image") {
            if (state.placingImage) {
                placeImageAt(page, pt.xPt, pt.yPt, state.placingImage);
                state.placingImage = null;
                showToast("Gambar ditempatkan. Seret untuk memindah, tarik sudut untuk resize.");
            } else {
                imageFileInput.click();
            }
        } else {
            deselectAll();
        }
    }

    /* =========================================================
       14. TEXT ELEMENTS
    ========================================================= */
    function createTextElement(page, xPt, yPt, initialText, autoFocus, recordHistory) {
        elCounter++;
        var fontPt = Number(fontSizeSelect.value) || 12;
        var el = {
            id: "el" + elCounter,
            type: "text",
            xPt: xPt, yPt: yPt,
            fontPt: fontPt,
            lineHeightPt: fontPt * 1.28,
            fontKey: fontFamilySelect.value || DEFAULT_FONT_KEY,
            color: textColorInput.value,
            bold: state.boldActive,
            text: initialText || "",
        };
        page.elements.push(el);
        var dom = buildTextDom(page, el);
        renderTextElStyle(page, el);
        selectElement(page, el);
        if (autoFocus) {
            dom.setAttribute("contenteditable", "true");
            requestAnimationFrame(function () {
                dom.focus();
                placeCaretEnd(dom);
            });
        }
        if (recordHistory) {
            pushHistory({
                undo: function () { deleteElementInternal(page, el); },
                redo: function () { reinsertElement(page, el); },
            });
        }
        return el;
    }

    function buildTextDom(page, el) {
        var dom = document.createElement("div");
        dom.className = "pdf-textbox";
        dom.dataset.elId = el.id;
        dom.setAttribute("data-placeholder", "Ketik di sini…");
        dom.textContent = el.text;
        page.overlayEl.appendChild(dom);
        el.domEl = dom;

        dom.addEventListener("input", function () {
            el.text = dom.innerText.replace(/\n+$/, "");
        });
        dom.addEventListener("blur", function () {
            dom.setAttribute("contenteditable", "false");
            if (state.selected && state.selected.elId === el.id) showToolbarFor(page, el);
        });
        dom.addEventListener("dblclick", function (e) {
            e.stopPropagation();
            dom.setAttribute("contenteditable", "true");
            hideToolbarFor(el);
            dom.focus();
            placeCaretEnd(dom);
        });
        dom.addEventListener("pointerdown", function (e) {
            e.stopPropagation();
            selectElement(page, el);
            if (dom.getAttribute("contenteditable") !== "true") {
                startDrag(page, el, dom, e);
            }
        });
        return dom;
    }

    function renderTextElStyle(page, el) {
        var dom = el.domEl;
        if (!dom) return;
        var s = page.displayScale;
        dom.style.left = (el.xPt * s) + "px";
        dom.style.top = (el.yPt * s) + "px";
        dom.style.fontSize = (el.fontPt * s) + "px";
        dom.style.lineHeight = (el.lineHeightPt / el.fontPt);
        dom.style.fontFamily = fontDefByKey(el.fontKey).css;
        dom.style.color = el.color;
        dom.style.fontWeight = el.bold ? "700" : "400";
        if (dom.innerText !== el.text) dom.textContent = el.text;
    }

    function placeCaretEnd(dom) {
        var range = document.createRange();
        range.selectNodeContents(dom);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    /* =========================================================
       15. SIGNATURE PAD
    ========================================================= */
    var padCtx = signaturePadCanvas.getContext("2d");
    var padDrawing = false;
    var padHasDrawn = false;

    function padPointFromEvent(e) {
        var rect = signaturePadCanvas.getBoundingClientRect();
        var scaleX = signaturePadCanvas.width / rect.width;
        var scaleY = signaturePadCanvas.height / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }

    signaturePadCanvas.addEventListener("pointerdown", function (e) {
        padDrawing = true;
        signaturePadCanvas.setPointerCapture(e.pointerId);
        var p = padPointFromEvent(e);
        padCtx.beginPath();
        padCtx.moveTo(p.x, p.y);
    });
    signaturePadCanvas.addEventListener("pointermove", function (e) {
        if (!padDrawing) return;
        var p = padPointFromEvent(e);
        padCtx.lineCap = "round";
        padCtx.lineJoin = "round";
        padCtx.strokeStyle = sigColorInput.value;
        padCtx.lineWidth = Number(brushSizeInput.value) * 1.6;
        padCtx.lineTo(p.x, p.y);
        padCtx.stroke();
        padHasDrawn = true;
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (evt) {
        signaturePadCanvas.addEventListener(evt, function () { padDrawing = false; });
    });

    $("clearSigPadBtn").addEventListener("click", function () {
        padCtx.clearRect(0, 0, signaturePadCanvas.width, signaturePadCanvas.height);
        padHasDrawn = false;
    });

    function trimCanvas(canvas) {
        var ctx = canvas.getContext("2d");
        var w = canvas.width, h = canvas.height;
        var data = ctx.getImageData(0, 0, w, h).data;
        var minX = w, minY = h, maxX = 0, maxY = 0, found = false;
        for (var y = 0; y < h; y += 2) {
            for (var x = 0; x < w; x += 2) {
                var alpha = data[(y * w + x) * 4 + 3];
                if (alpha > 10) {
                    found = true;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        if (!found) return null;
        var pad = 8;
        minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
        maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
        var ow = maxX - minX + 1, oh = maxY - minY + 1;
        var out = document.createElement("canvas");
        out.width = ow; out.height = oh;
        out.getContext("2d").drawImage(canvas, minX, minY, ow, oh, 0, 0, ow, oh);
        return { dataUrl: out.toDataURL("image/png"), w: ow, h: oh };
    }

    $("confirmSigBtn").addEventListener("click", function () {
        if (!padHasDrawn) {
            showToast("Gambar tanda tangan dulu di kanvas kecil di bawah.");
            return;
        }
        var trimmed = trimCanvas(signaturePadCanvas);
        if (!trimmed) {
            showToast("Tanda tangan kosong, coba gambar ulang.");
            return;
        }
        state.placingSignature = { dataUrl: trimmed.dataUrl, aspect: trimmed.w / trimmed.h };
        showToast("Sekarang klik di halaman untuk menempatkan tanda tangan.");
    });

    /* =========================================================
       16. IMAGE INSERT FLOW (new feature)
    ========================================================= */
    imageFileInput.addEventListener("change", function () {
        var file = imageFileInput.files[0];
        imageFileInput.value = "";
        if (!file) { if (state.tool === "image") setTool("select"); return; }
        if (!file.type.startsWith("image/")) {
            showToast("File harus berupa gambar.");
            if (state.tool === "image") setTool("select");
            return;
        }
        readFileAsDataUrl(file)
            .then(function (dataUrl) {
                return loadImageDims(dataUrl).then(function (dims) {
                    state.placingImage = { dataUrl: dataUrl, aspect: dims.w / dims.h };
                    setTool("image");
                    showToast("Sekarang klik di halaman untuk menempatkan gambar.");
                });
            })
            .catch(function (err) {
                console.error(err);
                showToast("Gagal membaca file gambar.");
            });
    });

    function placeSignatureAt(page, xPt, yPt, sig) {
        elCounter++;
        var wPt = Math.min(160, page.ptWidth * 0.35);
        var hPt = wPt / sig.aspect;
        var el = {
            id: "el" + elCounter,
            type: "signature",
            xPt: xPt - wPt / 2, yPt: yPt - hPt / 2,
            wPt: wPt, hPt: hPt,
            aspect: sig.aspect,
            dataUrl: sig.dataUrl,
            opacity: 1,
            lockAspect: true,
        };
        page.elements.push(el);
        buildImageDom(page, el);
        renderImageElStyle(page, el);
        selectElement(page, el);
        setTool("select");
        pushHistory({
            undo: function () { deleteElementInternal(page, el); },
            redo: function () { reinsertElement(page, el); },
        });
    }

    function placeImageAt(page, xPt, yPt, img) {
        elCounter++;
        var wPt = Math.min(220, page.ptWidth * 0.45);
        var hPt = wPt / img.aspect;
        var el = {
            id: "el" + elCounter,
            type: "image",
            xPt: xPt - wPt / 2, yPt: yPt - hPt / 2,
            wPt: wPt, hPt: hPt,
            aspect: img.aspect,
            dataUrl: img.dataUrl,
            opacity: 1,
            lockAspect: false,
        };
        page.elements.push(el);
        buildImageDom(page, el);
        renderImageElStyle(page, el);
        selectElement(page, el);
        setTool("select");
        pushHistory({
            undo: function () { deleteElementInternal(page, el); },
            redo: function () { reinsertElement(page, el); },
        });
    }

    function buildImageDom(page, el) {
        var dom = document.createElement("div");
        dom.className = el.type === "image" ? "pdf-image" : "pdf-signature";
        dom.dataset.elId = el.id;

        var img = document.createElement("img");
        img.src = el.dataUrl;
        img.draggable = false;
        dom.appendChild(img);

        var handle = document.createElement("div");
        handle.className = "resize-handle";
        dom.appendChild(handle);

        page.overlayEl.appendChild(dom);
        el.domEl = dom;

        dom.addEventListener("pointerdown", function (e) {
            if (e.target === handle) return;
            e.stopPropagation();
            selectElement(page, el);
            startDrag(page, el, dom, e);
        });
        handle.addEventListener("pointerdown", function (e) {
            e.stopPropagation();
            selectElement(page, el);
            startResize(page, el, e);
        });

        return dom;
    }

    function renderImageElStyle(page, el) {
        var dom = el.domEl;
        if (!dom) return;
        var s = page.displayScale;
        dom.style.left = (el.xPt * s) + "px";
        dom.style.top = (el.yPt * s) + "px";
        dom.style.width = (el.wPt * s) + "px";
        dom.style.height = (el.hPt * s) + "px";
        dom.style.opacity = el.opacity == null ? 1 : el.opacity;
    }

    /* =========================================================
       17. DRAG & RESIZE (with undo/redo on release)
    ========================================================= */
    function startDrag(page, el, dom, downEvent) {
        var startX = downEvent.clientX, startY = downEvent.clientY;
        var startXPt = el.xPt, startYPt = el.yPt;
        dom.setPointerCapture(downEvent.pointerId);
        var moved = false;

        function onMove(e) {
            var dxPt = (e.clientX - startX) / page.displayScale;
            var dyPt = (e.clientY - startY) / page.displayScale;
            if (Math.abs(dxPt) > 0.3 || Math.abs(dyPt) > 0.3) moved = true;
            el.xPt = startXPt + dxPt;
            el.yPt = startYPt + dyPt;
            if (el.type === "text") renderTextElStyle(page, el); else renderImageElStyle(page, el);
            repositionToolbarFor(el);
        }
        function onUp(e) {
            dom.removeEventListener("pointermove", onMove);
            dom.removeEventListener("pointerup", onUp);
            if (moved) {
                var endXPt = el.xPt, endYPt = el.yPt;
                pushHistory({
                    undo: function () {
                        el.xPt = startXPt; el.yPt = startYPt;
                        if (el.type === "text") renderTextElStyle(page, el); else renderImageElStyle(page, el);
                        repositionToolbarFor(el);
                    },
                    redo: function () {
                        el.xPt = endXPt; el.yPt = endYPt;
                        if (el.type === "text") renderTextElStyle(page, el); else renderImageElStyle(page, el);
                        repositionToolbarFor(el);
                    },
                });
            }
        }
        dom.addEventListener("pointermove", onMove);
        dom.addEventListener("pointerup", onUp);
    }

    function startResize(page, el, downEvent) {
        var dom = el.domEl;
        var startX = downEvent.clientX, startY = downEvent.clientY;
        var startWPt = el.wPt, startHPt = el.hPt;
        dom.setPointerCapture(downEvent.pointerId);

        function onMove(e) {
            var dxPt = (e.clientX - startX) / page.displayScale;
            if (el.lockAspect) {
                var newW = Math.max(20, startWPt + dxPt);
                el.wPt = newW;
                el.hPt = newW / el.aspect;
            } else {
                var dyPt = (e.clientY - startY) / page.displayScale;
                el.wPt = Math.max(20, startWPt + dxPt);
                el.hPt = Math.max(20, startHPt + dyPt);
            }
            renderImageElStyle(page, el);
            repositionToolbarFor(el);
        }
        function onUp() {
            dom.removeEventListener("pointermove", onMove);
            dom.removeEventListener("pointerup", onUp);
            var endW = el.wPt, endH = el.hPt;
            if (endW !== startWPt || endH !== startHPt) {
                pushHistory({
                    undo: function () { el.wPt = startWPt; el.hPt = startHPt; renderImageElStyle(page, el); repositionToolbarFor(el); },
                    redo: function () { el.wPt = endW; el.hPt = endH; renderImageElStyle(page, el); repositionToolbarFor(el); },
                });
            }
        }
        dom.addEventListener("pointermove", onMove);
        dom.addEventListener("pointerup", onUp);
    }

    /* =========================================================
       18. SELECTION / MINI TOOLBAR (sibling element, never eaten
           by contenteditable) / DELETE / DUPLICATE / OPACITY
    ========================================================= */
    function getSelectedElement() {
        if (!state.selected) return null;
        var page = findPage(state.selected.pageId);
        if (!page) return null;
        var el = findEl(page, state.selected.elId);
        if (!el) return null;
        return { page: page, el: el };
    }

    function removeToolbarDom(el) {
        if (el && el.toolbarEl) {
            el.toolbarEl.remove();
            el.toolbarEl = null;
        }
    }

    function deselectAll() {
        document.querySelectorAll(".pdf-textbox.selected, .pdf-signature.selected, .pdf-image.selected").forEach(function (d) {
            d.classList.remove("selected");
        });
        state.pages.forEach(function (page) {
            page.elements.forEach(function (el) { removeToolbarDom(el); });
        });
        state.selected = null;
        $("duplicateBtn").classList.add("hidden");
        $("deleteElBtn").classList.add("hidden");
    }

    function selectElement(page, el) {
        deselectAll();
        state.selected = { pageId: page.id, elId: el.id };
        el.domEl.classList.add("selected");
        showToolbarFor(page, el);
        $("duplicateBtn").classList.remove("hidden");
        $("deleteElBtn").classList.remove("hidden");
        if (el.type === "text") {
            fontFamilySelect.value = el.fontKey;
            fontSizeSelect.value = String(Math.round(el.fontPt));
            textColorInput.value = el.color;
            state.boldActive = !!el.bold;
            boldBtn.classList.toggle("active", state.boldActive);
        }
    }

    // Mini toolbar is appended to the PAGE OVERLAY (sibling of the element),
    // not inside the editable/draggable element itself. This is the fix for
    // the bug where the toolbar's own text/buttons were getting deleted or
    // inserted into the text content when typing.
    function showToolbarFor(page, el) {
        removeToolbarDom(el);
        var tb = document.createElement("div");
        tb.className = "el-toolbar";

        if (el.type === "image" || el.type === "signature") {
            var opLabel = document.createElement("span");
            opLabel.className = "toolbar-op-label";
            opLabel.textContent = "Opacity";
            tb.appendChild(opLabel);

            var opRange = document.createElement("input");
            opRange.type = "range";
            opRange.min = "0.05";
            opRange.max = "1";
            opRange.step = "0.05";
            opRange.value = el.opacity == null ? 1 : el.opacity;
            opRange.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
            opRange.addEventListener("input", function () {
                el.opacity = Number(opRange.value);
                renderImageElStyle(page, el);
            });
            opRange.addEventListener("change", function () {
                var newVal = Number(opRange.value);
                var oldVal = el._opacityBeforeDrag == null ? 1 : el._opacityBeforeDrag;
                pushHistory({
                    undo: function () { el.opacity = oldVal; renderImageElStyle(page, el); if (el.toolbarEl) { var r = el.toolbarEl.querySelector("input[type=range]"); if (r) r.value = oldVal; } },
                    redo: function () { el.opacity = newVal; renderImageElStyle(page, el); if (el.toolbarEl) { var r2 = el.toolbarEl.querySelector("input[type=range]"); if (r2) r2.value = newVal; } },
                });
                el._opacityBeforeDrag = newVal;
            });
            opRange.addEventListener("pointerdown", function () { el._opacityBeforeDrag = el.opacity == null ? 1 : el.opacity; });
            tb.appendChild(opRange);
        }

        var dupBtn = document.createElement("button");
        dupBtn.type = "button"; dupBtn.title = "Duplikat"; dupBtn.textContent = "⧉";
        dupBtn.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
        dupBtn.addEventListener("click", function (e) { e.stopPropagation(); duplicateElement(page, el); });

        var delBtn = document.createElement("button");
        delBtn.type = "button"; delBtn.title = "Hapus"; delBtn.textContent = "✕";
        delBtn.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
        delBtn.addEventListener("click", function (e) { e.stopPropagation(); deleteElement(page, el); });

        tb.appendChild(dupBtn);
        tb.appendChild(delBtn);

        page.overlayEl.appendChild(tb);
        el.toolbarEl = tb;
        repositionToolbarFor(el);
    }

    function hideToolbarFor(el) {
        if (el && el.toolbarEl) el.toolbarEl.style.display = "none";
    }

    function repositionToolbarFor(el) {
        if (!el || !el.toolbarEl || !el.domEl) return;
        var tb = el.toolbarEl;
        tb.style.display = "";
        tb.style.left = el.domEl.style.left;
        var topPx = parseFloat(el.domEl.style.top) || 0;
        tb.style.top = Math.max(0, topPx - 30) + "px";
    }

    function deleteElementInternal(page, el) {
        if (el.domEl) el.domEl.remove();
        removeToolbarDom(el);
        page.elements = page.elements.filter(function (x) { return x.id !== el.id; });
        if (state.selected && state.selected.elId === el.id) {
            state.selected = null;
            $("duplicateBtn").classList.add("hidden");
            $("deleteElBtn").classList.add("hidden");
        }
    }

    function reinsertElement(page, el) {
        page.elements.push(el);
        el.domEl = null;
        if (el.type === "text") { buildTextDom(page, el); renderTextElStyle(page, el); }
        else { buildImageDom(page, el); renderImageElStyle(page, el); }
        selectElement(page, el);
    }

    function deleteElement(page, el) {
        deleteElementInternal(page, el);
        pushHistory({
            undo: function () { reinsertElement(page, el); },
            redo: function () { deleteElementInternal(page, el); },
        });
    }

    function duplicateElement(page, el) {
        elCounter++;
        var copy = Object.assign({}, el, { id: "el" + elCounter, xPt: el.xPt + 14, yPt: el.yPt + 14, domEl: null, toolbarEl: null });
        page.elements.push(copy);
        if (copy.type === "text") { buildTextDom(page, copy); renderTextElStyle(page, copy); }
        else { buildImageDom(page, copy); renderImageElStyle(page, copy); }
        selectElement(page, copy);
        pushHistory({
            undo: function () { deleteElementInternal(page, copy); },
            redo: function () { reinsertElement(page, copy); },
        });
    }

    $("duplicateBtn").addEventListener("click", function () {
        var sel = getSelectedElement();
        if (sel) duplicateElement(sel.page, sel.el);
    });
    $("deleteElBtn").addEventListener("click", function () {
        var sel = getSelectedElement();
        if (sel) deleteElement(sel.page, sel.el);
    });

    document.addEventListener("keydown", function (e) {
        var sel = getSelectedElement();
        var editingText = document.activeElement && document.activeElement.getAttribute &&
            document.activeElement.getAttribute("contenteditable") === "true";
        if (editingText) return;
        if ((e.key === "Delete" || e.key === "Backspace") && sel) {
            e.preventDefault();
            deleteElement(sel.page, sel.el);
        } else if (e.key === "Escape") {
            deselectAll();
        }
    });

    canvasScrollArea.addEventListener("pointerdown", function (e) {
        if (e.target === canvasScrollArea || e.target === pagesContainer) deselectAll();
    });

    /* =========================================================
       19. RESET
    ========================================================= */
    var resetModalOverlay = $("resetModalOverlay");
    $("resetEditorBtn").addEventListener("click", function () { resetModalOverlay.classList.remove("hidden"); });
    $("resetModalCancel").addEventListener("click", function () { resetModalOverlay.classList.add("hidden"); });
    resetModalOverlay.addEventListener("click", function (e) { if (e.target === resetModalOverlay) resetModalOverlay.classList.add("hidden"); });
    $("resetModalConfirm").addEventListener("click", function () { location.reload(); });

    /* =========================================================
       20. EXPORT MODAL + PDF GENERATION
       Fonts always resolve to something usable — a failed Google Fonts
       fetch silently falls back to a locally-embeddable Inter font
       instead of Helvetica, and the export flow never throws to the
       console/user; any per-font issue is swallowed and export continues.
    ========================================================= */
    var exportModalOverlay = $("exportModalOverlay");
    var exportPaperSizeSelect = $("exportPaperSizeSelect");
    var exportQualitySelect = $("exportQualitySelect");
    var exportFileNameInput = $("exportFileNameInput");
    var exportShowOutlinesToggle = $("exportShowOutlinesToggle");
    var exportModalConfirm = $("exportModalConfirm");
    var exportConfirmLabel = $("exportConfirmLabel");

    function openExportModal() {
        if (state.pages.length === 0) {
            showToast("Tambahkan dokumen dulu sebelum mengunduh.");
            return;
        }
        exportModalOverlay.classList.remove("hidden");
    }
    $("openExportModalBtn").addEventListener("click", openExportModal);
    $("exportModalCancel").addEventListener("click", function () { exportModalOverlay.classList.add("hidden"); });
    exportModalOverlay.addEventListener("click", function (e) { if (e.target === exportModalOverlay) exportModalOverlay.classList.add("hidden"); });
    exportModalConfirm.addEventListener("click", exportPdf);

    var INTER_DEF = fontDefByKey("inter");
    var interFallbackCache = { r: null, b: null };

    function embedInterFallback(outDoc, bold) {
        var cacheKey = bold ? "b" : "r";
        if (interFallbackCache[cacheKey]) return interFallbackCache[cacheKey];
        var path = bold ? INTER_DEF.fileBold : INTER_DEF.file;
        var p = fetch(GH_FONT_BASE + path)
            .then(function (res) { if (!res.ok) throw new Error("http " + res.status); return res.arrayBuffer(); })
            .then(function (bytes) { return outDoc.embedFont(bytes, { subset: true }); })
            .catch(function (err) {
                console.warn("Inter fallback embed also failed, using built-in Helvetica as last resort", err);
                return outDoc.embedFont(bold ? PDFLib.StandardFonts.HelveticaBold : PDFLib.StandardFonts.Helvetica);
            });
        interFallbackCache[cacheKey] = p;
        return p;
    }

    function getEmbeddedFont(outDoc, fontDef, bold, cache) {
        var cacheKey = fontDef.key + (bold ? "_b" : "_r");
        if (cache[cacheKey]) return cache[cacheKey];
        var p;
        if (!fontDef.google) {
            var stdName = bold && fontDef.stdBold ? fontDef.stdBold : fontDef.std;
            p = outDoc.embedFont(PDFLib.StandardFonts[stdName]).catch(function () {
                return embedInterFallback(outDoc, bold);
            });
        } else {
            var path = bold && fontDef.fileBold ? fontDef.fileBold : fontDef.file;
            p = fetch(GH_FONT_BASE + path)
                .then(function (res) { if (!res.ok) throw new Error("http " + res.status); return res.arrayBuffer(); })
                .then(function (bytes) { return outDoc.embedFont(bytes, { subset: true }); })
                .catch(function (err) {
                    console.warn("Font embed fallback (using Inter) for", fontDef.key, err);
                    return embedInterFallback(outDoc, bold);
                });
        }
        cache[cacheKey] = p;
        return p;
    }

    function guessImageMimeFromDataUrl(dataUrl) {
        var m = /^data:([^;]+);/.exec(dataUrl);
        return m ? m[1] : "image/png";
    }

    function embedRasterImage(outDoc, dataUrl) {
        var bytes = dataUrlToUint8(dataUrl);
        var mime = guessImageMimeFromDataUrl(dataUrl);
        if (mime === "image/jpeg" || mime === "image/jpg") {
            return outDoc.embedJpg(bytes);
        }
        return outDoc.embedPng(bytes).catch(function () {
            // Some browsers may encode canvas/user images oddly; try jpg as a fallback so export never hard-fails.
            return outDoc.embedJpg(bytes);
        });
    }

    function exportPdf() {
        var paperChoice = exportPaperSizeSelect.value;
        var fileNameBase = (exportFileNameInput.value || "dokumen-terisi").trim().replace(/[^\w\-]+/g, "_") || "dokumen-terisi";
        var showOutlines = exportShowOutlinesToggle.checked;

        exportModalConfirm.disabled = true;
        exportConfirmLabel.textContent = "Menyiapkan…";

        Promise.resolve()
            .then(async function () {
                var outDoc = await PDFLib.PDFDocument.create();
                outDoc.registerFontkit(fontkit);
                var fontCache = {};

                for (var pi = 0; pi < state.pages.length; pi++) {
                    var page = state.pages[pi];
                    var targetW, targetH;
                    if (paperChoice === "original") { targetW = page.ptWidth; targetH = page.ptHeight; }
                    else { var sz = PAPER_SIZES[paperChoice]; targetW = sz.w; targetH = sz.h; }

                    var newPage = outDoc.addPage([targetW, targetH]);
                    var scale = Math.min(targetW / page.ptWidth, targetH / page.ptHeight);
                    var drawW = page.ptWidth * scale, drawH = page.ptHeight * scale;
                    var offX = (targetW - drawW) / 2, offY = (targetH - drawH) / 2;

                    if (page.sourcePdfPageIndex != null && state.sourcePdfBytes) {
                        try {
                            var embedded = await outDoc.embedPdf(state.sourcePdfBytes, [page.sourcePdfPageIndex]);
                            newPage.drawPage(embedded[0], { x: offX, y: offY, xScale: scale, yScale: scale });
                        } catch (embErr) {
                            console.warn("Gagal menyalin halaman sumber, halaman dibiarkan putih", embErr);
                            newPage.drawRectangle({ x: 0, y: 0, width: targetW, height: targetH, color: PDFLib.rgb(1, 1, 1) });
                        }
                    } else {
                        newPage.drawRectangle({ x: 0, y: 0, width: targetW, height: targetH, color: PDFLib.rgb(1, 1, 1) });
                    }

                    for (var ei = 0; ei < page.elements.length; ei++) {
                        var el = page.elements[ei];
                        try {
                            if (el.type === "text") {
                                if (!el.text) continue;
                                var fontDef = fontDefByKey(el.fontKey);
                                var font = await getEmbeddedFont(outDoc, fontDef, el.bold, fontCache);
                                var sizePt = el.fontPt * scale;
                                var rgbArr = hexToRgb01(el.color);
                                var lines = el.text.split("\n");
                                var maxLineW = 0;
                                lines.forEach(function (line, li) {
                                    var topDownLineTop = el.yPt + li * el.lineHeightPt;
                                    var baselineTopDown = topDownLineTop + el.fontPt * 0.82;
                                    var bottomUpY = page.ptHeight - baselineTopDown;
                                    var xTarget = offX + el.xPt * scale;
                                    var yTarget = offY + bottomUpY * scale;
                                    newPage.drawText(line, { x: xTarget, y: yTarget, size: sizePt, font: font, color: PDFLib.rgb(rgbArr[0], rgbArr[1], rgbArr[2]) });
                                    if (el.bold && fontDef.google && !fontDef.fileBold) {
                                        newPage.drawText(line, { x: xTarget + 0.35, y: yTarget, size: sizePt, font: font, color: PDFLib.rgb(rgbArr[0], rgbArr[1], rgbArr[2]) });
                                    }
                                    try { var w = font.widthOfTextAtSize(line, sizePt); if (w > maxLineW) maxLineW = w; } catch (e) { }
                                });
                                if (showOutlines) {
                                    var boxH = (lines.length * el.lineHeightPt) * scale;
                                    var boxTopDown = el.yPt;
                                    var boxBottomUp = page.ptHeight - boxTopDown - (lines.length * el.lineHeightPt);
                                    newPage.drawRectangle({
                                        x: offX + el.xPt * scale, y: offY + boxBottomUp * scale,
                                        width: Math.max(maxLineW, 10), height: boxH,
                                        borderColor: PDFLib.rgb(0.12, 0.44, 0.29), borderWidth: 0.6, borderDashArray: [3, 2],
                                    });
                                }
                            } else if (el.type === "signature" || el.type === "image") {
                                var img = await embedRasterImage(outDoc, el.dataUrl);
                                var wPt = el.wPt * scale, hPt = el.hPt * scale;
                                var topDownBottom = el.yPt + el.hPt;
                                var bottomUpBottom = page.ptHeight - topDownBottom;
                                newPage.drawImage(img, {
                                    x: offX + el.xPt * scale, y: offY + bottomUpBottom * scale,
                                    width: wPt, height: hPt,
                                    opacity: el.opacity == null ? 1 : el.opacity,
                                });
                                if (showOutlines) {
                                    newPage.drawRectangle({
                                        x: offX + el.xPt * scale, y: offY + bottomUpBottom * scale, width: wPt, height: hPt,
                                        borderColor: PDFLib.rgb(0.12, 0.44, 0.29), borderWidth: 0.6, borderDashArray: [3, 2],
                                    });
                                }
                            }
                        } catch (elErr) {
                            // Never let a single element abort the whole export.
                            console.warn("Melewati satu elemen karena error saat export", elErr);
                        }
                    }
                }

                var bytes = await outDoc.save();
                downloadBlob(bytes, fileNameBase + ".pdf");
                showToast("PDF berhasil diunduh.");
                exportModalOverlay.classList.add("hidden");
            })
            .catch(function (err) {
                console.error(err);
                showToast("Gagal membuat PDF. Coba lagi.");
            })
            .finally(function () {
                exportModalConfirm.disabled = false;
                exportConfirmLabel.textContent = "Unduh PDF";
            });
    }

    /* =========================================================
       21. INIT
    ========================================================= */
    populateSelects();
    updateEmptyState();
    updateUndoRedoButtons();
})();