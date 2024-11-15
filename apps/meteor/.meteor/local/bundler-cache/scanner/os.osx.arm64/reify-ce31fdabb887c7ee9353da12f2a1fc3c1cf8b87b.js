"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = rng;
const crypto_1 = require("crypto");
const rnds8Pool = new Uint8Array(256);
let poolPtr = rnds8Pool.length;
function rng() {
    if (poolPtr > rnds8Pool.length - 16) {
        (0, crypto_1.randomFillSync)(rnds8Pool);
        poolPtr = 0;
    }
    return rnds8Pool.slice(poolPtr, (poolPtr += 16));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3JuZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUtBLHNCQU1DO0FBWEQsbUNBQXdDO0FBRXhDLE1BQU0sU0FBUyxHQUFHLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3RDLElBQUksT0FBTyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFFL0IsU0FBd0IsR0FBRztJQUN6QixJQUFJLE9BQU8sR0FBRyxTQUFTLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRSxDQUFDO1FBQ3BDLElBQUEsdUJBQWMsRUFBQyxTQUFTLENBQUMsQ0FBQztRQUMxQixPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsQ0FBQztJQUNELE9BQU8sU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFDIn0=