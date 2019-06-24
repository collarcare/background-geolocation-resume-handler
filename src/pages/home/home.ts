import { Component, OnDestroy, OnInit } from '@angular/core';
import { Platform } from 'ionic-angular';
import BackgroundGeolocation, {
  Config,
  Location,
  MotionChangeEvent,
} from 'cordova-background-geolocation';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy{

  private readonly geoConfig: Config = {

    // Force Config every launch
    reset: true,

    // Geolocation Options
    distanceFilter: 5,
    disableElasticity: false,
    elasticityMultiplier: 1,
    stopAfterElapsedMinutes: 0,
    stopOnStationary: false,
    desiredOdometerAccuracy: 15,

    // Geolocation iOS Options
    stationaryRadius: 25,
    useSignificantChangesOnly: false,
    locationAuthorizationRequest: 'WhenInUse',
    locationAuthorizationAlert: {
      titleWhenNotEnabled: 'TRACKING.GPS_OFF_TITLE',
      titleWhenOff: 'TRACKING.GPS_OFF_TITLE',
      instructions: 'TRACKING.GPS_OFF_MSG',
      cancelButton: 'GENERAL.ABORT',
      settingsButton: 'TRACKING.GPS_OFF_SETTINGS',
    },
    disableLocationAuthorizationAlert: false,

    // Geolocation Android Options
    locationUpdateInterval: 1000,
    fastestLocationUpdateInterval: 1000,
    deferTime: 0,
    allowIdenticalLocations: false,

    // Activity Recognition Options
    activityRecognitionInterval: 60000,
    stopTimeout: 15,
    minimumActivityRecognitionConfidence: 75,
    stopDetectionDelay: 0,
    disableStopDetection: true,
    pausesLocationUpdatesAutomatically: false,

    // Activity Recognition iOS Options
    disableMotionActivityUpdates: true,

    // HTTP & Persistence Options
    autoSync: false,
    maxRecordsToPersist: 0,

    // Application Options
    stopOnTerminate: true,
    startOnBoot: false,
    heartbeatInterval: 60,

    // Application iOS Options
    preventSuspend: true,

    // Application Android Options
    foregroundService: true,
    enableHeadless: false,
    notificationText: 'GPS aktiv',
    forceReloadOnMotionChange: false,
    forceReloadOnLocationChange: false,
    forceReloadOnHeartbeat: false,
    forceReloadOnBoot: false,

    // Logging & Debug Options
    debug: true,
    logMaxDays: 3,

  };

  // tslint:disable-next-line:no-unused-variable
  private pause: any;
  // tslint:disable-next-line:no-unused-variable
  private resume: any;

  private enabled = false;
  private isReady = false;
  
  private configuredStopResumeHandler = false;
  private onLocation: any;
  private onMotionChange: any;

  constructor(
    private readonly platform: Platform
  ) {
    this.setMissingVariables();
  }
  private setMissingVariables() {
    if (this.platform != null && this.platform.is('cordova')) {
      this.geoConfig.desiredAccuracy = BackgroundGeolocation.DESIRED_ACCURACY_HIGH;
      this.geoConfig.activityType = BackgroundGeolocation.ACTIVITY_TYPE_OTHER;
      this.geoConfig.notificationPriority = BackgroundGeolocation.NOTIFICATION_PRIORITY_DEFAULT;
      this.geoConfig.logLevel = BackgroundGeolocation.LOG_LEVEL_VERBOSE;
    }
  }

  async ngOnInit(): Promise<any> {

    if (this.platform.is('cordova')) {
      return this.platform.ready().then(this.configureBackgroundGeolocation.bind(this));
    }

  }

  ngOnDestroy() {

    if (this.isReady && this.enabled) {
      return this.stopWatchingPosition();
    }

  }

  private configureResumeHandlers() {

    if (this.platform.is('cordova')) {

      this.pause = this.platform.pause.subscribe(async () => {
        if (this.isReady && this.enabled) {
          await this.stopWatchingPosition();
        }
      });

      this.resume = this.platform.resume.subscribe(async () => {
        if (this.isReady && !this.enabled) {
          await this.startWatchingPosition();
        }
      });

      this.configuredStopResumeHandler = true;
    }
  }

  private async configureBackgroundGeolocation(): Promise<void> {

    if (!this.isReady) {

      this.onLocation = this.onLocationFunction.bind(this);
      this.onMotionChange = this.onMotionChangeFunction.bind(this);

      BackgroundGeolocation.onLocation(this.onLocation);
      BackgroundGeolocation.onMotionChange(this.onMotionChange);

      BackgroundGeolocation.ready(this.geoConfig, () => {
          this.enabled = false;
          this.isReady = true;
          if (!this.configuredStopResumeHandler) {
            this.configureResumeHandlers();
          }
          return this.startWatchingPosition();
        }, err => {
          console.error(err);
        }
      );

    } else {

      BackgroundGeolocation.removeListener('location', this.onLocation);
      BackgroundGeolocation.removeListener('motionchange', this.onMotionChange);

      this.onLocation = this.onLocationFunction.bind(this);
      this.onMotionChange = this.onMotionChangeFunction.bind(this);

      BackgroundGeolocation.onLocation(this.onLocation);
      BackgroundGeolocation.onMotionChange(this.onMotionChange);

      if (!this.configuredStopResumeHandler) {
        this.configureResumeHandlers();
      }
      return this.startWatchingPosition();
    }

  }

  /**
   * Start Background Tracking
   */
  private async startWatchingPosition(): Promise<void> {

    if (!this.enabled) {
      this.enabled = true;
      console.log('Start watching Position');
      try {
        await BackgroundGeolocation.start();
        await BackgroundGeolocation.changePace(true);
      } catch (err) {
        console.error(err);
      }
    }

  }

  /**
   * Stops Background Tracking
   */
  private async stopWatchingPosition(): Promise<void> {

    if (this.platform.is('cordova')) {
      console.log('Stop watching Position');
      this.enabled = false;
      try {
        await BackgroundGeolocation.changePace(false);
        await BackgroundGeolocation.stop();
      } catch (err) {
        console.error(err);
      }
    }

  }


  /**
   * Event which is triggered for each location change
   * @param location the location
   */
  private onLocationFunction(location: Location) {
    console.log('onLocation', location);
  }


  /**
   * Event which is triggered for each motion chance
   * @param event moving change event
   */
  private onMotionChangeFunction(event: MotionChangeEvent) {
    console.log('onMotionChange', event);
  }

}
