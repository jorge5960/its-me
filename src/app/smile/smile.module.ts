import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SmilePageRoutingModule } from './smile-routing.module';
import { SmilePage } from './smile.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SmilePageRoutingModule
  ],
  declarations: [SmilePage],
  providers: []
})
export class SmilePageModule {}
