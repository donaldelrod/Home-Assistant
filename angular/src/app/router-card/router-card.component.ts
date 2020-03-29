import { Component, OnInit, Input } from '@angular/core';
import { routerDevice } from '../routerDevice';

@Component({
  selector: 'app-router-card',
  templateUrl: './router-card.component.html',
  styleUrls: ['./router-card.component.scss']
})
export class RouterCardComponent implements OnInit {
  @Input() routerDevice: routerDevice;

  constructor() { }

  ngOnInit() {

  }

}
