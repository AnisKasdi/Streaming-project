const http = require("http");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const url = require("url");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");

// Créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurer multer pour gérer les uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Initialisation de la base de données SQLite
const db = new sqlite3.Database("database.db", (err) => {
    if (err) {
        console.error("Erreur lors de l'ouverture de la base de données :", err.message);
    } else {
        console.log("Base de données SQLite ouverte.");
        db.run(`CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            displayName TEXT,
            profilePicture TEXT DEFAULT 'https://via.placeholder.com/150',
            favorites TEXT,
            watchHistory TEXT
        )`);
        db.run("ALTER TABLE accounts ADD COLUMN displayName TEXT", (err) => {
            if (err && err.code !== "SQLITE_ERROR") console.error("Erreur ALTER displayName:", err);
        });
        db.run("ALTER TABLE accounts ADD COLUMN profilePicture TEXT DEFAULT 'https://via.placeholder.com/150'", (err) => {
            if (err && err.code !== "SQLITE_ERROR") console.error("Erreur ALTER profilePicture:", err);
        });
    }
});

// Fonction utilitaire pour parser les cookies
function parseCookies(request) {
    const list = {};
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach(cookie => {
        let parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
}

// Helper pour parser le corps d'une requête JSON
const parseRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => body += chunk.toString());
        req.on("end", () => {
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(err);
            }
        });
    });
};

const server = http.createServer(async (request, response) => {
    const parsedUrl = url.parse(request.url, true);
    const urlWithoutQuery = parsedUrl.pathname;
    const filePath = "./public" + (urlWithoutQuery === "/" ? "/index.html" : urlWithoutQuery);
    const ext = path.extname(filePath);
    const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".json": "application/json"
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";
    const encoding = (contentType.startsWith("text") || contentType === "application/json") ? "utf8" : null;

    // Route API pour récupérer la liste des animes
    if (request.url.startsWith("/api/animes") && request.method === "GET") {
        try {
            const apiResponse = await axios.get("https://api.jikan.moe/v4/top/anime", { params: { limit: 25 } });
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify(apiResponse.data));
        } catch (error) {
            response.statusCode = 500;
            response.end(JSON.stringify({ error: "Erreur lors de la récupération des animes" }));
        }
        return;
    }

    // Route API pour récupérer le profil
    if (parsedUrl.pathname === "/api/profile" && request.method === "GET") {
        const cookies = parseCookies(request);
        const username = cookies.username;
        if (!username) {
            response.statusCode = 401;
            response.end(JSON.stringify({ error: "Non connecté" }));
            return;
        }
        db.get("SELECT username, displayName, profilePicture, favorites, watchHistory FROM accounts WHERE username = ?", [username], (err, row) => {
            if (err) {
                response.statusCode = 500;
                response.end(JSON.stringify({ error: err.message }));
            } else if (row) {
                response.setHeader("Content-Type", "application/json");
                response.end(JSON.stringify(row));
            } else {
                response.statusCode = 404;
                response.end(JSON.stringify({ error: "Utilisateur non trouvé" }));
            }
        });
        return;
    }

    // Route API pour créer un compte
    if (parsedUrl.pathname === "/api/create-account" && request.method === "POST") {
        try {
            const body = await parseRequestBody(request);
            const { username, password } = body;
            if (!username || !password) {
                response.statusCode = 400;
                response.end(JSON.stringify({ error: "Username et password requis" }));
                return;
            }
            db.run("INSERT INTO accounts (username, password, displayName, profilePicture, favorites, watchHistory) VALUES (?, ?, ?, ?, ?, ?)",
                [username, password, username, "/uploads/default.jpg", JSON.stringify([]), JSON.stringify([])],
                function (err) {
                    if (err) {
                        response.statusCode = 500;
                        response.end(JSON.stringify({ error: err.message }));
                    } else {
                        response.setHeader("Content-Type", "application/json");
                        response.setHeader("Set-Cookie", `username=${username}; Path=/; Max-Age=86400; SameSite=Strict`);
                        response.end(JSON.stringify({ message: "Compte créé", id: this.lastID }));
                    }
                }
            );
        } catch (err) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: "Requête invalide" }));
        }
        return;
    }

    // Route API pour la connexion
    if (parsedUrl.pathname === "/api/login" && request.method === "POST") {
        try {
            const body = await parseRequestBody(request);
            const { username, password } = body;
            if (!username || !password) {
                response.statusCode = 400;
                response.end(JSON.stringify({ error: "Username et password requis" }));
                return;
            }
            db.get("SELECT * FROM accounts WHERE username = ? AND password = ?", [username, password], (err, row) => {
                if (err) {
                    response.statusCode = 500;
                    response.end(JSON.stringify({ error: err.message }));
                } else if (row) {
                    response.setHeader("Content-Type", "application/json");
                    response.setHeader("Set-Cookie", `username=${username}; Path=/; Max-Age=86400; SameSite=Strict`);
                    response.end(JSON.stringify({ message: "Connexion réussie" }));
                } else {
                    response.statusCode = 401;
                    response.end(JSON.stringify({ error: "Identifiants invalides" }));
                }
            });
        } catch (err) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: "Requête invalide" }));
        }
        return;
    }

    // Route API pour mettre à jour le mot de passe
    if (parsedUrl.pathname === "/api/update-password" && request.method === "POST") {
        try {
            const body = await parseRequestBody(request);
            const { username, oldPassword, newPassword } = body;
            if (!username || !oldPassword || !newPassword) {
                response.statusCode = 400;
                response.end(JSON.stringify({ error: "Tous les champs sont requis" }));
                return;
            }
            db.get("SELECT * FROM accounts WHERE username = ? AND password = ?", [username, oldPassword], (err, row) => {
                if (err) {
                    response.statusCode = 500;
                    response.end(JSON.stringify({ error: err.message }));
                } else if (row) {
                    db.run("UPDATE accounts SET password = ? WHERE username = ?", [newPassword, username], (err2) => {
                        if (err2) {
                            response.statusCode = 500;
                            response.end(JSON.stringify({ error: err2.message }));
                        } else {
                            response.end(JSON.stringify({ message: "Mot de passe mis à jour" }));
                        }
                    });
                } else {
                    response.statusCode = 401;
                    response.end(JSON.stringify({ error: "Ancien mot de passe incorrect" }));
                }
            });
        } catch (err) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: "Requête invalide" }));
        }
        return;
    }

    // Route API pour ajouter un favori
    if (parsedUrl.pathname === "/api/add-favorite" && request.method === "POST") {
        try {
            const body = await parseRequestBody(request);
            const { username, anime } = body;
            if (!username || !anime) {
                response.statusCode = 400;
                response.end(JSON.stringify({ error: "Username et anime requis" }));
                return;
            }
            db.get("SELECT favorites FROM accounts WHERE username = ?", [username], (err, row) => {
                if (err) {
                    response.statusCode = 500;
                    response.end(JSON.stringify({ error: err.message }));
                } else if (row) {
                    let favorites = JSON.parse(row.favorites || "[]");
                    if (!favorites.includes(anime)) favorites.push(anime);
                    db.run("UPDATE accounts SET favorites = ? WHERE username = ?", [JSON.stringify(favorites), username], (err2) => {
                        if (err2) {
                            response.statusCode = 500;
                            response.end(JSON.stringify({ error: err2.message }));
                        } else {
                            response.end(JSON.stringify({ message: "Favori ajouté", favorites }));
                        }
                    });
                } else {
                    response.statusCode = 404;
                    response.end(JSON.stringify({ error: "Utilisateur non trouvé" }));
                }
            });
        } catch (err) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: "Requête invalide" }));
        }
        return;
    }

    // Route API pour supprimer un favori
    if (parsedUrl.pathname === "/api/remove-favorite" && request.method === "POST") {
        try {
            const body = await parseRequestBody(request);
            const { username, anime } = body;
            if (!username || !anime) {
                response.statusCode = 400;
                response.end(JSON.stringify({ error: "Username et anime requis" }));
                return;
            }
            db.get("SELECT favorites FROM accounts WHERE username = ?", [username], (err, row) => {
                if (err) {
                    response.statusCode = 500;
                    response.end(JSON.stringify({ error: err.message }));
                } else if (row) {
                    let favorites = JSON.parse(row.favorites || "[]");
                    favorites = favorites.filter(fav => fav !== anime);
                    db.run("UPDATE accounts SET favorites = ? WHERE username = ?", [JSON.stringify(favorites), username], (err2) => {
                        if (err2) {
                            response.statusCode = 500;
                            response.end(JSON.stringify({ error: err2.message }));
                        } else {
                            response.end(JSON.stringify({ message: "Favori supprimé", favorites }));
                        }
                    });
                } else {
                    response.statusCode = 404;
                    response.end(JSON.stringify({ error: "Utilisateur non trouvé" }));
                }
            });
        } catch (err) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: "Requête invalide" }));
        }
        return;
    }

    // Route pour mettre à jour le profil (avec upload de fichier)
    if (parsedUrl.pathname === "/api/update-profile" && request.method === "POST") {
        const cookies = parseCookies(request);
        const username = cookies.username;

        if (!username) {
            response.statusCode = 401;
            response.end(JSON.stringify({ error: "Non connecté" }));
            return;
        }

        // Utiliser multer pour gérer l'upload
        upload.single("profilePicture")(request, response, (err) => {
            if (err) {
                response.statusCode = 400;
                response.end(JSON.stringify({ error: "Erreur lors de l'upload: " + err.message }));
                return;
            }

            // Récupérer les champs du formulaire
            const displayName = request.body.displayName;
            const file = request.file;

            if (!displayName && !file) {
                response.statusCode = 400;
                response.end(JSON.stringify({ error: "Au moins un champ (displayName ou profilePicture) est requis" }));
                return;
            }

            const updateFields = [];
            const updateValues = [];
            if (displayName) {
                updateFields.push("displayName = ?");
                updateValues.push(displayName);
            }
            if (file) {
                const imagePath = `/uploads/${file.filename}`;
                updateFields.push("profilePicture = ?");
                updateValues.push(imagePath);
            }
            updateValues.push(username);

            db.run(
                `UPDATE accounts SET ${updateFields.join(", ")} WHERE username = ?`,
                updateValues,
                (err) => {
                    if (err) {
                        response.statusCode = 500;
                        response.end(JSON.stringify({ error: err.message }));
                    } else {
                        response.setHeader("Content-Type", "application/json");
                        response.end(JSON.stringify({ message: "Profil mis à jour avec succès" }));
                    }
                }
            );
        });
        return;
    }

    // Servir les fichiers statiques
    fs.readFile(filePath, encoding, (err, data) => {
        if (err) {
            response.statusCode = 404;
            response.setHeader("Content-Type", "text/html");
            response.end(fs.readFileSync("./public/404.html", "utf8"));
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