
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SHOP_DRESSES_ROUTES } from './constants';

@NgModule({
  imports: [ RouterModule.forChild(SHOP_DRESSES_ROUTES) ],
  providers: [],
  exports: [ RouterModule ]
})
export class ShopDressesRoutingModule {
}
