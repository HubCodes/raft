import { State } from "../src/state";

declare global {
	namespace Express {
		interface Request {
			state: State;
		}
	}
}
