import { ICopyright } from "songtreasures";
import BaseItem from "./base";

export default class Copyright extends BaseItem implements ICopyright {
    constructor(i: ICopyright) {
        super(i);
    }
}
