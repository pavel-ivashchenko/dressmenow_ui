
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { BackToTopComponent } from './back-to-top/back-to-top.component';
import { SliderComponent } from './slider/slider.component';
import { ScrollDownComponent } from './scroll-down/scroll-down.component';
import { CarouselComponent } from './carousel/carousel.component';
import { CarouselSmallComponent } from './carousel-small/carousel-small.component';
import { CartModalComponent } from './cart-modal/cart-modal.component';
import { UserModalComponent } from './user-modal/user-modal.component';
import { FormErrorComponent } from './form-error/form-error.component';
import { CreateAccountComponent } from './user-modal/components/create-account/create-account.component';

export const COMPONENTS = [
  HeaderComponent,
  FooterComponent,
  BackToTopComponent,
  SliderComponent,
  ScrollDownComponent,
  CarouselComponent,
  CarouselSmallComponent,
  CartModalComponent,
  UserModalComponent,
  FormErrorComponent,
  CreateAccountComponent
];

export const ENTRY_COMPONENTS = [
  CartModalComponent,
  UserModalComponent,
  CreateAccountComponent
];
