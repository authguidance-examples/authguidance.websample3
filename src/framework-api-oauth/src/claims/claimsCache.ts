import {injectable} from 'inversify';
import hasher from 'js-sha256';
import NodeCache from 'node-cache';
import {Logger} from 'winston';
import {CoreApiClaims, LoggerFactory} from '../../../framework-api-base';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';

/*
 * A simple in memory claims cache for our API
 */
@injectable()
export class ClaimsCache<TClaims extends CoreApiClaims> {

    /*
     * Plumbing to enable the framework to create the correct generic type at runtime
     * We need to pass in a constructor function plus paremters for constructor arguments
     */
    public static createInstance<TClaimsCache>(
        construct: new (c: OAuthConfiguration, lf: LoggerFactory) => TClaimsCache,
        configuration: OAuthConfiguration,
        loggerFactory: LoggerFactory): TClaimsCache {

        return new construct(configuration, loggerFactory);
    }

    private readonly _cache: NodeCache;
    private readonly _traceLogger: Logger;

    /*
     * Create the cache at application startup
     */
    public constructor(configuration: OAuthConfiguration, loggerFactory: LoggerFactory) {

        // Get our logger
        this._traceLogger = loggerFactory.getDevelopmentLogger(ClaimsCache.name);

        // Create the cache and set a maximum time to live in seconds
        const defaultExpirySeconds = configuration.maxClaimsCacheMinutes * 60;
        this._cache = new NodeCache({
            stdTTL: defaultExpirySeconds,
        });

        // If required add debug output here to verify expiry occurs when expected
        this._cache.on('expired', (key: string, value: any) => {
            this._traceLogger.debug(`Expired token has been removed from the cache (hash: ${key})`);
        });
    }

    /*
     * Get claims from the cache or return null if not found
     */
    public async getClaimsForToken(accessToken: string): Promise<TClaims | null> {

        // Get the token hash and see if it exists in the cache
        const hash = hasher.sha256(accessToken);
        const claims = await this._cache.get<TClaims>(hash);
        if (!claims) {

            // If this is a new token and we need to do claims processing
            this._traceLogger.debug(`New token will be added to claims cache (hash: ${hash})`);
            return null;
        }

        // Otherwise return cached claims
        this._traceLogger.debug(`Found existing token in claims cache (hash: ${hash})`);
        return claims;
    }

    /*
     * Add claims to the cache until the token's time to live
     */
    public async addClaimsForToken(accessToken: string, expiry: number, claims: TClaims): Promise<void> {

        // Use the exp field returned from introspection to work out the token expiry time
        const epochSeconds = Math.floor((new Date() as any) / 1000);
        let secondsToCache = expiry - epochSeconds;
        if (secondsToCache > 0) {

            // Get the hash and output debug info
            const hash = hasher.sha256(accessToken);
            this._traceLogger.debug(`Token to be cached will expire in ${secondsToCache} seconds (hash: ${hash})`);

            // Do not exceed the maximum time we configured
            if (secondsToCache > this._cache.options.stdTTL!) {
                secondsToCache = this._cache.options.stdTTL!;
            }

            // Cache the token until the above time
            this._traceLogger.debug(`Adding token to claims cache for ${secondsToCache} seconds (hash: ${hash})`);
            await this._cache.set(hash, claims, secondsToCache);
        }
    }
}
