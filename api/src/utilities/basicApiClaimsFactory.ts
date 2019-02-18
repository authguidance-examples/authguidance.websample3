import {injectable} from 'inversify';
import {BasicApiClaims} from '../entities/BasicApiClaims';

/*
 * A helper object to allow us to inject our claims
 */
@injectable()
export class BasicApiClaimsFactory {

    private _claims: BasicApiClaims;

    public constructor() {
        console.log('*** CONSTRUCTING FACTORY');
        this._claims = new BasicApiClaims();
    }

    public setClaims(claims: BasicApiClaims): void {
        console.log('*** FACTORY SETTING CLAIMS');
        this._claims = claims;
    }

    public getClaims(): BasicApiClaims {

        return this._claims;
    }
}
