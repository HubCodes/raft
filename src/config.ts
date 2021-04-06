import { PeerId } from "./state";

export interface Peer {
	id: PeerId;
	host: string;
	port: number;
}

export interface Config {
	peers: Peer[];
	self: Peer;
}
