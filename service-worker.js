const CACHE_NAME = "activaciones-v37";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/styles.css",
    "./js/app.js",
    "./js/scanner.js",
    "./js/vinValidator.js",
    "./assets/logo.png",
    "./assets/iconos/activador_vento.png",
    "./assets/iconos/jefe_activador.png",
    "./assets/iconos/icono-activaciones.png",
    "https://unpkg.com/@zxing/library@latest",
    "https://unpkg.com/@zxing/browser@latest"
];

self.addEventListener("install", event => {

    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.all(
                FILES_TO_CACHE.map(url =>
                    cache
                        .add(new Request(url, { cache: "reload" }))
                        .catch(err =>
                            console.warn("No se pudo guardar en caché:", url, err)
                        )
                )
            )
        )
    );
});


self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});


self.addEventListener("fetch", event => {

    const req = event.request;

    // Los envíos (POST) los maneja el navegador directamente
    if (req.method !== "GET") return;

    const url = new URL(req.url);

    // Apps Script va directo a la red (la app ya maneja sus propios errores)
    if (
        url.hostname === "script.google.com" ||
        url.hostname.endsWith("googleusercontent.com")
    ) {
        return;
    }

    event.respondWith(
        fetch(req)
            .then(response => {

                // Guardar una copia de lo propio para uso sin conexión
                if (
                    response &&
                    response.status === 200 &&
                    url.origin === self.location.origin
                ) {
                    const copia = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, copia));
                }

                return response;
            })
            .catch(() => caches.match(req, { ignoreSearch: true }))
    );
});