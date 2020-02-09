import {Container} from 'inversify';
import {LOGICTYPES} from '../../logic/configuration/logicTypes';
import {CompanyRepository} from '../../logic/repositories/companyRepository';
import {CompanyService} from '../../logic/services/companyService';
import {JsonFileReader} from '../../logic/utilities/jsonFileReader';
import {CompanyController} from '../controllers/companyController';
import {UserInfoController} from '../controllers/userInfoController';
import {HOSTTYPES} from './hostTypes';

/*
 * Compose the application's business dependencies
 */
export class CompositionRoot {

    /*
     * Register this API's dependencies, most of which will be recreated for each API request
     * Note that Inversify instantiates each per request object at application startup to create a dependency graph
     */
    public static registerDependencies(container: Container): void {

        // Controller classes have a REST based request scope
        container.bind<CompanyController>(HOSTTYPES.CompanyController).to(CompanyController).inRequestScope();
        container.bind<UserInfoController>(HOSTTYPES.UserInfoController).to(UserInfoController).inRequestScope();

        // Business logic classes use a non REST based transient scope
        container.bind<CompanyService>(LOGICTYPES.CompanyService).to(CompanyService).inTransientScope();
        container.bind<CompanyRepository>(LOGICTYPES.CompanyRepository).to(CompanyRepository).inTransientScope();
        container.bind<JsonFileReader>(LOGICTYPES.JsonFileReader).to(JsonFileReader).inTransientScope();
    }
}
