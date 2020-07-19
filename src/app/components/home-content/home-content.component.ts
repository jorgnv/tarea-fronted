import { Component, OnInit } from "@angular/core";
import {
  faTrash,
  faEdit,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { AuthService } from "src/app/auth/auth.service";
import { Tarea } from "./tarea";
import {
  NgbModal,
  ModalDismissReasons,
  NgbCalendar,
} from "@ng-bootstrap/ng-bootstrap";
import { ApiService } from "../../api/api.service";
import { SelectItem, MessageService } from "primeng/api";

@Component({
  selector: "app-home-content",
  templateUrl: "./home-content.component.html",
  styleUrls: ["./home-content.component.css"],
  providers: [MessageService],
})
export class HomeContentComponent implements OnInit {
  faTrash = faTrash;
  faEdit = faEdit;
  faCheck = faCheck;
  faTimes = faTimes;
  closeResult = "";
  dateSelected = false;
  model;
  tareas: any;
  idUser: string;
  post: Object;
  cols: any[];
  selectedTarea: Tarea;
  brands: SelectItem[];
  tarea: Tarea = {};
  nuevaTarea: boolean;
  displayDialog: boolean;
  date: any;
  show: boolean;
  displayModal: boolean;
  expirar: any;
  spinner: boolean;
  constructor(
    private modalService: NgbModal,
    private api: ApiService,
    private calendar: NgbCalendar,
    public auth: AuthService,
    private messageService: MessageService
  ) {}
  ngOnInit() {
    this.spinner = true;
    this.show = false;
    setTimeout(() => {
      this.auth.isAuthenticated$.subscribe((data) => {
        if (data) {
          this.auth.userProfile$.subscribe((profile) => {
            this.idUser = profile["sub"];
            this.api.getExpired(this.idUser).subscribe((res) => {
              if (res["data"].length > 0) {
                this.displayModal = true;
                this.expirar = res["data"];
              }
            });
            this.spinner = false;
            this.loadData();
          });
        }
      });
    }, 3000);

    this.brands = [
      { label: "Ninguna", value: "" },
      { label: "Normal", value: "normal" },
      { label: "Urgente", value: "urgente" },
    ];

    this.cols = [
      { field: "nombre", header: "Nombre" },
      { field: "prioridad", header: "Prioridad" },
      { field: "fecha_vencimiento", header: "Fecha de vencimiento" },
    ];
  }

  loadData() {
    this.api.getList(this.idUser).subscribe((data) => {
      if (data["tareas"].length > 0) {
        this.show = true;
      }
      this.tareas = data["tareas"];
    });
  }

  showDialogToAdd() {
    this.nuevaTarea = true;
    this.tarea = {};
    this.displayDialog = true;
  }

  save() {
    let tareas = [...this.tareas];
    if (this.nuevaTarea) {
      tareas.push(this.tarea);
      const data = Object.assign(this.tarea, { idUser: this.idUser });
      this.api.postTarea(data).subscribe((data) => {});
    } else {
      this.api.updateTarea(this.tarea).subscribe((data) => {
        this.loadData();
        tareas[this.tareas.indexOf(this.selectedTarea)] = this.tarea;
      });
    }

    this.tareas = tareas;
    this.tarea = null;
    this.displayDialog = false;
  }

  delete() {
    this.api.delete(this.tarea["_id"]).subscribe((data) => {
      this.loadData();
      let index = this.tareas.indexOf(this.selectedTarea);
      this.tareas = this.tareas.filter((val, i) => i != index);
      this.tarea = null;
      this.displayDialog = false;
    });
  }

  onRowSelect(event) {
    this.nuevaTarea = false;
    this.tarea = this.cloneCar(event.data);
    this.displayDialog = true;
  }

  cloneCar(c: Tarea): Tarea {
    let car = {};
    for (let prop in c) {
      car[prop] = c[prop];
    }
    return car;
  }
}
