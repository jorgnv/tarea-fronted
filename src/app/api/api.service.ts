import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  baseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.baseUrl = `${environment.api}`;
  }

  public getList(id) {
    return this.httpClient.get(`${this.baseUrl}/tareas/${id}`);
  }

  public postTarea(data) {
    return this.httpClient.post(`${this.baseUrl}/tareas/`, data);
  }

  public updateTarea(data) {
    return this.httpClient.put(`${this.baseUrl}/tareas/`, data);
  }

  public delete(id) {
    return this.httpClient.delete(`${this.baseUrl}/tareas/${id}`);
  }

  public getExpired(id) {
    return this.httpClient.get(`${this.baseUrl}/tareas/date/expired/${id}`);
  }
}
