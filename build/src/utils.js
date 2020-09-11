"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
function sendAndLogError(res, error) {
    console.log("Error:", error);
    res.status(404).send(JSON.stringify({ "error": error }));
}
exports.sendAndLogError = sendAndLogError;
exports.asyncFilter = (arr, predicate) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const results = yield Promise.all(arr.map(predicate));
    return arr.filter((_v, index) => results[index]);
});
//# sourceMappingURL=utils.js.map