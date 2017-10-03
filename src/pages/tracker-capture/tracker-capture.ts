import {Component, OnInit} from '@angular/core';
import {IonicPage, ModalController, NavController} from 'ionic-angular';
import {UserProvider} from "../../providers/user/user";
import {AppProvider} from "../../providers/app/app";
import {OrganisationUnitsProvider} from "../../providers/organisation-units/organisation-units";
import {ProgramsProvider} from "../../providers/programs/programs";

/**
 * Generated class for the TrackerCapturePage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-tracker-capture',
  templateUrl: 'tracker-capture.html',
})
export class TrackerCapturePage implements OnInit{

  selectedOrgUnit : any;
  selectedProgram : any;
  currentUser: any;
  programIdsByUserRoles: Array<string>;
  isLoading : boolean;
  loadingMessage : string;
  organisationUnitLabel: string;
  programLabel: string;
  isFormReady : boolean;
  isProgramDimensionApplicable : boolean;
  programDimensionNotApplicablableMessage : string;
  programCategoryCombo : any;
  selectedDataDimension : Array<any>;
  programs : Array<any>;
  icons : any = {};

  //  WITHOUT_REGISTRATION

  constructor(public navCtrl: NavController,private modalCtrl : ModalController,
              private userProvider : UserProvider,private appProvider : AppProvider,
              private programsProvider : ProgramsProvider,
              private organisationUnitsProvider : OrganisationUnitsProvider) {
  }

  ionViewDidLoad() {
  }

  ngOnInit(){
    this.icons.orgUnit = "assets/data-entry/orgUnit.png";
    this.icons.program = "assets/event-capture/program.png";

    this.loadingMessage = "Loading. user information";
    this.isLoading = true;
    this.isFormReady = false;
    this.isProgramDimensionApplicable = false;
    this.userProvider.getCurrentUser().then((currentUser: any)=>{
      this.currentUser = currentUser;
      this.userProvider.getUserData().then((userData : any)=>{
        this.programIdsByUserRoles = [];
        userData.userRoles.forEach((userRole:any)=>{
          if (userRole.programs) {
            userRole.programs.forEach((program:any)=>{
              this.programIdsByUserRoles.push(program.id);
            });
          }
        });
        this.organisationUnitsProvider.getLastSelectedOrganisationUnitUnit(currentUser).then((lastSelectedOrgUnit : any)=>{
          if(lastSelectedOrgUnit && lastSelectedOrgUnit.id){
            this.selectedOrgUnit = lastSelectedOrgUnit;
            this.loadingPrograms();
          }
          this.updateTrackerCaptureSelections();
        });
      });
    },error=>{
      this.isLoading = false;
      this.loadingMessage = "";
      this.appProvider.setNormalNotification("Fail to load user information");
    });
  }

  loadingPrograms(){
    this.isLoading = true;
    this.loadingMessage = "Loading assigned programs";
    let programType = "WITH_REGISTRATION";
    this.programsProvider.getProgramsAssignedOnOrgUnitAndUserRoles(this.selectedOrgUnit.id,programType,this.programIdsByUserRoles,this.currentUser).then((programs : any)=>{
      this.programs = programs;
      this.selectedProgram = this.programsProvider.lastSelectedProgram;
      this.updateTrackerCaptureSelections();
      this.isLoading = false;
      this.loadingMessage = "";
    },error=>{
      this.isLoading = false;
      this.loadingMessage = "";
      console.log(JSON.stringify(error));
      this.appProvider.setNormalNotification("Fail to load assigned programs");
    });
  }

  updateTrackerCaptureSelections(){
    if(this.organisationUnitsProvider.lastSelectedOrgUnit){
      this.selectedOrgUnit = this.organisationUnitsProvider.lastSelectedOrgUnit;
      this.organisationUnitLabel = this.selectedOrgUnit.name;
    }else{
      this.organisationUnitLabel = "Touch to select organisation Unit";
    }
    if(this.selectedProgram && this.selectedProgram.name){
      this.programLabel = this.selectedProgram.name;
    }else {
      this.programLabel = "Touch to select entry form";
    }
    this.isFormReady = this.isAllParameterSelected();
    this.isLoading = false;
    this.loadingMessage = "";
  }

  openOrganisationUnitTree(){
    let modal = this.modalCtrl.create('OrganisationUnitSelectionPage',{});
    modal.onDidDismiss((selectedOrgUnit : any)=>{
      if(selectedOrgUnit && selectedOrgUnit.id){
        this.selectedOrgUnit = selectedOrgUnit;
        this.updateTrackerCaptureSelections();
        this.loadingPrograms();
      }
    });
    modal.present();
  }

  openProgramList(){
    if(this.programs && this.programs.length > 0){
      let modal = this.modalCtrl.create('ProgramSelection',{
        currentProgram : this.selectedProgram, programsList : this.programs
      });
      modal.onDidDismiss((selectedProgram : any)=>{
        if(selectedProgram && selectedProgram.id){
          this.selectedProgram = selectedProgram;
          this.programsProvider.setLastSelectedProgram(selectedProgram);
          this.updateTrackerCaptureSelections();
        }
      });
      modal.present();
    }else{
      this.appProvider.setNormalNotification("There are no program to select on " + this.selectedOrgUnit.name);
    }
  }

  isAllParameterSelected(){
    let result = false;
    if(this.selectedProgram && this.selectedProgram.name){
      result = true;
    }

    return result;
  }


}