/*
 *
 * Copyright 2015 HISP Tanzania
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301, USA.
 *
 * @since 2015
 * @author Joseph Chingalo <profschingalo@gmail.com>
 *
 */
import { Component, OnInit } from '@angular/core';
import { IonicPage, ModalController, NavController } from 'ionic-angular';
import { OrganisationUnitsProvider } from '../../providers/organisation-units/organisation-units';
import { UserProvider } from '../../providers/user/user';
import { AppProvider } from '../../providers/app/app';
import { DataSetsProvider } from '../../providers/data-sets/data-sets';
import { PeriodSelectionProvider } from '../../providers/period-selection/period-selection';
import { AppTranslationProvider } from '../../providers/app-translation/app-translation';
import { Store } from '@ngrx/store';
import { State, getCurrentUserColorSettings } from '../../store';
import { Observable } from 'rxjs';

/**
 * Generated class for the DataEntryPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-data-entry',
  templateUrl: 'data-entry.html'
})
export class DataEntryPage implements OnInit {
  selectedOrgUnit: any;
  selectedDataSet: any;
  selectedPeriod: any;
  currentUser: any;
  isLoading: boolean;
  loadingMessage: string;
  isFormReady: boolean;
  isDataSetDimensionApplicable: boolean;
  isDataSetDimensionApplicableCategoriesMessage: string;
  organisationUnitLabel: string;
  dataSetLabel: string;
  periodLabel: string;
  dataSetIdsByUserRoles: Array<any>;
  dataSets: Array<any>;
  dataSetCategoryCombo: any;
  selectedDataDimension: Array<any>;
  currentPeriodOffset: number;
  icons: any = {};
  translationMapper: any;
  colorSettings$: Observable<any>;

  constructor(
    private store: Store<State>,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private userProvider: UserProvider,
    private appProvider: AppProvider,
    private dataSetProvider: DataSetsProvider,
    private periodSelection: PeriodSelectionProvider,
    private organisationUnitsProvider: OrganisationUnitsProvider,
    private appTranslation: AppTranslationProvider
  ) {
    this.icons.orgUnit = 'assets/icon/orgUnit.png';
    this.icons.dataSet = 'assets/icon/form.png';
    this.icons.period = 'assets/icon/period.png';
    this.icons.goToDataEntryForm = 'assets/icon/enterDataPen.png';
    this.isLoading = true;
    this.currentPeriodOffset = 0;
    this.isDataSetDimensionApplicable = false;
    this.translationMapper = {};
    this.colorSettings$ = this.store.select(getCurrentUserColorSettings);
  }

  ngOnInit() {
    this.appTranslation.getTransalations(this.getValuesToTranslate()).subscribe(
      (data: any) => {
        this.translationMapper = data;
        this.loadingCurrentUserInformation();
      },
      error => {
        this.loadingCurrentUserInformation();
      }
    );
  }

  loadingCurrentUserInformation() {
    let key = 'Discovering current user information';
    this.loadingMessage = this.translationMapper[key]
      ? this.translationMapper[key]
      : key;
    this.userProvider.getCurrentUser().subscribe(
      (currentUser: any) => {
        this.currentUser = currentUser;
        this.userProvider.getUserData().subscribe((userData: any) => {
          this.dataSetIdsByUserRoles = userData.dataSets;
          this.organisationUnitsProvider
            .getLastSelectedOrganisationUnitUnit(currentUser)
            .subscribe(lastSelectedOrgUnit => {
              this.selectedOrgUnit = lastSelectedOrgUnit;
              this.updateDataEntryFormSelections();
              this.loadingEntryForm();
            });
          this.updateDataEntryFormSelections();
        });
      },
      error => {
        this.isLoading = false;
        this.loadingMessage = '';
        this.appProvider.setNormalNotification(
          'Failed to discover current user information'
        );
      }
    );
  }

  updateDataEntryFormSelections() {
    if (this.organisationUnitsProvider.lastSelectedOrgUnit) {
      this.selectedOrgUnit = this.organisationUnitsProvider.lastSelectedOrgUnit;
      this.organisationUnitLabel = this.selectedOrgUnit.name;
    } else {
      this.organisationUnitLabel = 'Touch to select organisation unit';
    }
    if (this.selectedDataSet && this.selectedDataSet.name) {
      this.dataSetLabel = this.selectedDataSet.name;
    } else {
      this.dataSetLabel = 'Touch to select entry form';
      this.selectedPeriod = null;
    }

    if (this.selectedPeriod && this.selectedPeriod.name) {
      this.periodLabel = this.selectedPeriod.name;
    } else {
      this.periodLabel = 'Touch to select period';
    }
    this.isFormReady = this.isAllFormParameterSelected();
    this.isLoading = false;
    this.loadingMessage = '';
  }

  openOrganisationUnitTree() {
    let modal = this.modalCtrl.create('OrganisationUnitSelectionPage', {
      filterType: 'dataSets'
    });
    modal.onDidDismiss((selectedOrgUnit: any) => {
      if (selectedOrgUnit && selectedOrgUnit.id) {
        this.selectedOrgUnit = selectedOrgUnit;
        this.updateDataEntryFormSelections();
        this.loadingEntryForm();
      }
    });
    modal.present();
  }

  loadingEntryForm() {
    this.dataSetProvider
      .getAssignedDataSets(
        this.selectedOrgUnit.id,
        this.dataSetIdsByUserRoles,
        this.currentUser
      )
      .subscribe(
        (dataSets: any) => {
          this.dataSets = dataSets;
          this.selectedDataSet = this.dataSetProvider.lastSelectedDataSet;
          if (dataSets.length == 0) {
            this.selectedPeriod = {};
            this.selectedDataSet = {};
          } else {
            this.currentPeriodOffset = 0;
            if (this.selectedDataSet && this.selectedDataSet.categoryCombo) {
              this.updateDataSetCategoryCombo(
                this.selectedDataSet.categoryCombo
              );
            }
            this.loadPeriodSelection();
          }
          this.updateDataEntryFormSelections();
        },
        error => {
          this.appProvider.setNormalNotification(
            'Failed to discover entry form'
          );
        }
      );
  }

  openEntryFormList() {
    if (this.dataSets && this.dataSets.length > 0) {
      let modal = this.modalCtrl.create('DataSetSelectionPage', {
        dataSetsList: this.dataSets,
        currentDataSet: {
          id: this.selectedDataSet.id || '',
          name: this.selectedDataSet.name || ''
        }
      });
      modal.onDidDismiss((selectedDataSet: any) => {
        if (
          selectedDataSet &&
          selectedDataSet.id &&
          selectedDataSet.id != this.selectedDataSet.id
        ) {
          this.selectedDataSet = selectedDataSet;
          this.dataSetProvider.setLastSelectedDataSet(selectedDataSet);
          this.currentPeriodOffset = 0;
          this.updateDataEntryFormSelections();
          this.loadPeriodSelection();
          if (this.selectedDataSet && this.selectedDataSet.categoryCombo) {
            this.updateDataSetCategoryCombo(this.selectedDataSet.categoryCombo);
          }
        }
      });
      modal.present();
    } else {
      this.appProvider.setNormalNotification(
        'There are no entry form to select on selected organisation unit'
      );
    }
  }

  loadPeriodSelection() {
    if (this.selectedDataSet && this.selectedDataSet.id) {
      let periodType = this.selectedDataSet.periodType;
      let openFuturePeriods = parseInt(this.selectedDataSet.openFuturePeriods);
      let periods = this.periodSelection.getPeriods(
        periodType,
        openFuturePeriods,
        this.currentPeriodOffset
      );
      if (periods && periods.length > 0) {
        this.selectedPeriod = periods[0];
      } else {
        this.selectedPeriod = {};
      }
    }
    this.updateDataEntryFormSelections();
  }

  openPeriodList() {
    if (this.selectedDataSet && this.selectedDataSet.id) {
      let modal = this.modalCtrl.create('PeriodSelectionPage', {
        periodType: this.selectedDataSet.periodType,
        currentPeriodOffset: this.currentPeriodOffset,
        openFuturePeriods: this.selectedDataSet.openFuturePeriods,
        currentPeriod: this.selectedPeriod
      });

      modal.onDidDismiss((data: any) => {
        if (data && data.selectedPeriod) {
          this.selectedPeriod = data.selectedPeriod;
          this.currentPeriodOffset = data.currentPeriodOffset;
          this.updateDataEntryFormSelections();
        }
      });
      modal.present();
    } else {
      this.appProvider.setNormalNotification('Please select entry form first');
    }
  }

  openDataDimensionSelection(category) {
    if (
      category.categoryOptions &&
      category.categoryOptions &&
      category.categoryOptions.length > 0
    ) {
      let currentIndex = this.dataSetCategoryCombo.categories.indexOf(category);
      let modal = this.modalCtrl.create('DataDimensionSelectionPage', {
        categoryOptions: category.categoryOptions,
        title: category.name,
        currentSelection: this.selectedDataDimension[currentIndex]
          ? this.selectedDataDimension[currentIndex]
          : {}
      });
      modal.onDidDismiss((selectedDataDimension: any) => {
        if (selectedDataDimension && selectedDataDimension.id) {
          this.selectedDataDimension[currentIndex] = selectedDataDimension;
          this.updateDataEntryFormSelections();
        }
      });
      modal.present();
    } else {
      let message =
        'There is no option for seleted category that associated with selected organisation unit';
      this.appProvider.setNormalNotification(message);
    }
  }

  updateDataSetCategoryCombo(categoryCombo) {
    let dataSetCategoryCombo = {};
    if (categoryCombo.name != 'default') {
      dataSetCategoryCombo['id'] = categoryCombo.id;
      dataSetCategoryCombo['name'] = categoryCombo.name;
      let categories = this.dataSetProvider.getDataSetCategoryComboCategories(
        this.selectedOrgUnit.id,
        this.selectedDataSet.categoryCombo.categories
      );
      dataSetCategoryCombo['categories'] = categories;
      this.isDataSetDimensionApplicable = true;

      this.isDataSetDimensionApplicableCategoriesMessage = 'All';
      categories.forEach((category: any) => {
        if (category.categoryOptions && category.categoryOptions.length == 0) {
          this.isDataSetDimensionApplicable = false;
        }
      });
      this.isDataSetDimensionApplicableCategoriesMessage = this.translationMapper[
        'All disaggregation are restricted from entry in selected organisation unit, please choose a different form or contact your support desk'
      ];
    }
    this.selectedDataDimension = [];
    this.dataSetCategoryCombo = dataSetCategoryCombo;
    this.updateDataEntryFormSelections();
  }

  openDataEntryForm() {
    let parameter = {
      orgUnit: { id: this.selectedOrgUnit.id, name: this.selectedOrgUnit.name },
      dataSet: { id: this.selectedDataSet.id, name: this.selectedDataSet.name },
      period: { iso: this.selectedPeriod.iso, name: this.selectedPeriod.name },
      dataDimension: this.getDataDimensions()
    };
    this.navCtrl.push('DataEntryFormPage', { parameter: parameter });
  }

  getDataDimensions() {
    let cc = this.selectedDataSet.categoryCombo.id;
    let cp = '';
    this.selectedDataDimension.forEach((dimension: any, index: any) => {
      if (index == 0) {
        cp += dimension.id;
      } else {
        cp += ';' + dimension.id;
      }
    });
    return { cc: cc, cp: cp };
  }

  isAllFormParameterSelected() {
    let isFormReady = true;
    if (
      this.selectedPeriod &&
      this.selectedPeriod.name &&
      this.selectedDataSet &&
      this.selectedDataSet.categoryCombo.name &&
      this.selectedDataSet.categoryCombo.name != 'default'
    ) {
      if (
        this.selectedDataDimension &&
        this.selectedDataDimension.length > 0 &&
        this.selectedDataDimension.length ==
          this.dataSetCategoryCombo.categories.length
      ) {
        let count = 0;
        this.selectedDataDimension.forEach((dimension: any) => {
          count++;
        });
        if (count != this.selectedDataDimension.length) {
          isFormReady = false;
        }
      } else {
        isFormReady = false;
      }
    } else if (
      this.periodLabel == 'Touch to select period' ||
      this.dataSetLabel == 'Touch to select entry form'
    ) {
      isFormReady = false;
    }
    return isFormReady;
  }

  getValuesToTranslate() {
    return [
      'All disaggregation are restricted from entry in selected organisation unit, please choose a different form or contact your support desk',
      'Discovering current user information'
    ];
  }
}
