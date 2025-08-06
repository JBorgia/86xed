import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  constructor() {}

  getConfig() {
    return {
      app: {
        name: '86xed',
        version: '1.0.0',
      },
    };
  }
}
