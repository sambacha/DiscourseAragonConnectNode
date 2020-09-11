"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Email_1 = require("./Email");
const Proposals_1 = require("./Proposals");
const Aragon_1 = require("./Aragon");
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const getKeyDocHelper = require("@docknetwork/sdk/utils/vc/helpers");
const VC = require("@docknetwork/sdk/verifiable-credential");
const CONTEXT_JSON = require("../public/context-json-ld.json");
const elliptic = require('elliptic');
const secp256k1Curve = new elliptic.ec('secp256k1');
const APP = express();
const IS_LINUX_SERVER = process.platform == "linux";
const CROSS_ORIGIN_URL = IS_LINUX_SERVER ? "https://forum.researchcollective.io" : "http://localhost:3000";
let KEY_DOC = null;
const SERVER_URL = "api.researchcollective.io";
APP.use(function (_req, res, next) {
    res.header("Access-Control-Allow-Origin", CROSS_ORIGIN_URL);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
APP.use(express.static(__dirname, { dotfiles: 'allow' }));
APP.use(express.json());
function getKeyDoc() {
    fs.readFile('./keypair.json', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
        const privateKey = JSON.parse(data)["priv"];
        const keyPair = secp256k1Curve.keyFromPrivate(privateKey, 16);
        KEY_DOC = getKeyDocHelper(process.env.DAO_DID, keyPair, "EcdsaSecp256k1VerificationKey2019");
    });
}
APP.post('/submitNewAragonVote', Aragon_1.default.NewVoteProposal);
APP.post('/submitNewAragonTokenRequest', Aragon_1.default.NewTokenProposal);
APP.post('/getVoteTransaction', Aragon_1.default.VoteOnProposal);
APP.post('/submitNewProposal', Proposals_1.default.GenerateProposal);
APP.post('/signCredential', function (_req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        res.send("deprecated, use /signCredentialAndEmail");
    });
});
APP.post('/signCredentialAndEmail', function (req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const email = req.body["contactEmail"];
        const vc = VC.fromJSON(req.body["credential"]);
        yield vc.sign(KEY_DOC);
        console.log("verified credential proof:", vc.proof);
        res.send(vc);
        const response = yield Email_1.default.SendEmail(email, JSON.stringify(vc));
        console.log("mailgun response:", response);
    });
});
APP.get('/credentials/v1', function (_req, res) {
    console.log("Got a  credential request");
    res.send(CONTEXT_JSON);
});
getKeyDoc();
if (IS_LINUX_SERVER) {
    const https = require('https');
    const privateKey = fs.readFileSync(`/etc/letsencrypt/live/${SERVER_URL}/privkey.pem`, 'utf8');
    const certificate = fs.readFileSync(`/etc/letsencrypt/live/${SERVER_URL}/cert.pem`, 'utf8');
    const ca = fs.readFileSync(`/etc/letsencrypt/live/${SERVER_URL}/chain.pem`, 'utf8');
    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };
    const httpsServer = https.createServer(credentials, APP);
    httpsServer.listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });
}
else {
    const PORT = 3001;
    APP.listen(PORT, () => console.log(`listening at http://localhost:${PORT}`));
}
//# sourceMappingURL=app.js.map