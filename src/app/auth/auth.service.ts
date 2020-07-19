import { Injectable } from "@angular/core";
import createAuth0Client from "@auth0/auth0-spa-js";
import Auth0Client from "@auth0/auth0-spa-js/dist/typings/Auth0Client";
import {
  from,
  of,
  Observable,
  BehaviorSubject,
  combineLatest,
  throwError,
  Subject,
} from "rxjs";
import { tap, catchError, concatMap, shareReplay } from "rxjs/operators";
import { Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  public loggedIn: boolean = null;
  title: any;
  public permissions: string[];
  public id: string;
  public role: string;
  public removed: any;
  public permissions$ = new Observable((observer) => {
    this.auth0Client$.subscribe((client) => {
      if (client.isAuthenticated()) {
        from(client.getTokenSilently()).subscribe((token) => {
          this.tokenSilently$ = token;
          const decodedToken = this.helper.decodeToken(token);
          this.permissions = decodedToken.permissions;
          // this.menuPermited = this.dashboardMenu.filter(item => this.permissionsVsMenu(item, this.permissions));
          observer.next(decodedToken.permissions);
        });
      }
    });
  }) as Observable<string[]>;

  private helper = new JwtHelperService();

  private accessToken$ = new Observable<any>();
  public tokenSilently$ = this.accessToken$;

  private userProfileSubject$ = new BehaviorSubject<any>(null);
  public userProfile$ = this.userProfileSubject$.asObservable();

  auth0Client$ = (from(
    createAuth0Client({
      domain: environment.auth0.domain,
      client_id: environment.auth0.clientId,
      redirect_uri: `${window.location.origin}`,
      audience: environment.auth0.audience,
    })
  ) as Observable<Auth0Client>).pipe(
    shareReplay(1), // Every subscription receives the same shared value
    catchError((err) => throwError(err))
  );

  public isAuthenticated$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.isAuthenticated())),
    tap((res) => (this.loggedIn = res))
  );

  handleRedirectCallback$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.handleRedirectCallback()))
  );

  constructor(private router: Router) {
    // On initial load, check authentication state with authorization server
    // Set up local auth streams if user is already authenticated
    this.localAuthSetup();
    // Handle redirect from Auth0 login
    this.handleAuthCallback();
  }

  // When calling, options can be passed if desired
  // https://auth0.github.io/auth0-spa-js/classes/auth0client.html#getuser
  getUser$(options?): Observable<any> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getUser(options))),
      tap((user) => this.userProfileSubject$.next(user))
    );
  }

  // When calling, options can be passed if desired
  // https://auth0.github.io/auth0-spa-js/classes/auth0client.html#gettokensilently
  getTokenSilently$(options?): Observable<string> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getTokenSilently(options)))
    );
  }

  public localAuthSetup() {
    // This should only be called on app initialization
    // Set up local authentication streams
    const checkAuth$ = this.isAuthenticated$.pipe(
      concatMap((loggedIn: boolean) => {
        if (loggedIn) {
          // If authenticated, get user and set in app
          // NOTE: you could pass options here if needed
          return this.getUser$();
        }
        // If not authenticated, return stream that emits 'false'
        return of(loggedIn);
      })
    );
    checkAuth$.subscribe();
  }

  login(redirectPath: string = "/") {
    //   // A desired redirect path can be passed to login method
    //   // (e.g., from a route guard)
    //   // Ensure Auth0 client instance exists
    this.auth0Client$.subscribe((client: Auth0Client) => {
      //     // Call method to log in
      client.loginWithRedirect({
        redirect_uri: `${window.location.origin}`,
        appState: { target: redirectPath },
      });
    });
  }

  private handleAuthCallback() {
    // Call when app reloads after user logs in with Auth0

    const params = window.location.search;
    if (params.includes("code=") && params.includes("state=")) {
      let targetRoute: string; // Path to redirect to after login processsed
      const authComplete$ = this.handleRedirectCallback$.pipe(
        // Have client, now call method to handle auth callback redirect
        tap((cbRes) => {
          // Get and set target redirect route from callback results
          targetRoute =
            cbRes.appState && cbRes.appState.target
              ? cbRes.appState.target
              : "/";
        }),
        concatMap(() => {
          // Redirect callback complete; get user, login status and access token
          return combineLatest([
            this.getTokenSilently$(),
            this.getUser$(),
            this.isAuthenticated$,
          ]);
        })
      );
      // Subscribe to authentication completion observable
      // Response will be an array of user and login status
      authComplete$.subscribe(([user, loggedIn]) => {
        // Redirect to target route after callback processing
        this.router.navigate([targetRoute]);
      });
    }
  }

  logout() {
    // Ensure Auth0 client instance exists
    localStorage.clear();
    this.auth0Client$.subscribe((client: Auth0Client) => {
      // Call method to log out
      client.logout({
        client_id: environment.auth0.clientId,
        returnTo: window.location.origin,
      });
    });
  }
}
