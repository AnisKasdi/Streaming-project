import http from "http";
import fs from "fs";
import path from "path";

const server = http.createServer((request, response) => {
    const filePath = "./public" + (request.url === "/" ? "/index.html" : request.url);
    const ext = path.extname(filePath);
    const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif"
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";
    
    // Pour le texte, on utilise l'encodage utf8, sinon null pour des fichiers binaires comme les images
    const encoding = contentType.startsWith("text") ? "utf8" : null;
    
    fs.readFile(filePath, encoding, (err, data) => {
        if(err) {
            response.statusCode = 404;
            console.log("Erreur 404 pour la ressource " + filePath);
            const notFoundContent = fs.readFileSync("./public/404.html", "utf8");
            response.setHeader("Content-Type", "text/html");
            response.end(notFoundContent);
        } else {
            response.setHeader("Content-Type", contentType);
            response.end(data);
        }
    });
});

const port = 8081;
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});


