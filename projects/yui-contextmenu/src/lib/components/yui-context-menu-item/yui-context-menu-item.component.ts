import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    TemplateRef,
    ViewChild,
    OnDestroy,
    HostBinding,
    HostListener,
    ElementRef
} from "@angular/core";
import { ContextMenuService } from "../../services/context-menu.service";
import { IMenuItemContextMenuRefPair } from "../../interfaces/IMenuItemContextMenuRefPair";
import { IContextMenuRef } from "../../interfaces/IContextMenuRef";
import { TemplateType } from "../../interfaces/TemplateType";
import { IExtendedMenuItem, TOGGLE_ICON } from "../../interfaces/IExtendedMenuItem";
import { Highlightable, FocusableOption } from "@angular/cdk/a11y";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { IContextMenuData } from "../../interfaces/IContextMenuData";


@Component({
    selector: "yui-contextmenu-item",
    templateUrl: "./yui-context-menu-item.component.html",
    styleUrls: ["./yui-context-menu-item.component.scss"]
})
export class YuiContextMenuItemComponent implements OnInit, OnDestroy, Highlightable, FocusableOption {

    private menuData: IContextMenuData = null;
    private submenuRef: IContextMenuRef = null;

    @Input() changeCallback: () => void;
    @Input() depth: number;
    @Input() menuClass: string;
    @Input() menuItem: IExtendedMenuItem;
    @Input() rootMenuId: number;
    @Output() menuHover: EventEmitter<IMenuItemContextMenuRefPair> = new EventEmitter<IMenuItemContextMenuRefPair>();
    @Output() menuSelect: EventEmitter<IMenuItemContextMenuRefPair> = new EventEmitter<IMenuItemContextMenuRefPair>();
    @ViewChild("submenuTemplate") submenuTemplate: TemplateRef<any>;

    public constructor(
        private readonly contextMenuService: ContextMenuService,
        private readonly domSanitizer: DomSanitizer,
        public readonly hostElementRef: ElementRef
    ) {
    }

    ngOnInit(): void {
        this.contextMenuService.CurrentDepth = this.depth;
    }

    ngOnDestroy(): void {
        this.menuItem.focused = false;
    }

    public createSubmenu(target: Element, item: IExtendedMenuItem, viaKeyboard: boolean = false): void {
        if (item.menuItems?.length > 0) {
            const popupTarget = target.closest("li");
            this.contextMenuService.SubmenuCreatedViaKeyboard = viaKeyboard;
            this.submenuRef = this.contextMenuService.createContextMenu(
                popupTarget,
                this.submenuTemplate,
                true
            );
            this.menuData = {
                depth: this.depth,
                contextMenuRef: this.submenuRef,
                menuId: Date.now(),
                rootMenuId: this.rootMenuId,
                isSubmenu: true
            };
            this.contextMenuService.addActiveMenu(this.menuData);
            this.changeCallback();
        }
    }

    public focus(): void {
        (this.hostElementRef.nativeElement as HTMLElement).focus();
    }

    public getTemplate(template: TemplateType): TemplateRef<any> {
        return template instanceof TemplateRef ? template : template();
    }

    public getToggleIcon(): SafeResourceUrl {
        return this.domSanitizer.bypassSecurityTrustResourceUrl(TOGGLE_ICON);
    }

    public isToggleable(menuItem: IExtendedMenuItem): boolean {
        return !menuItem.icon && !menuItem.iconTemplate && !menuItem.image && menuItem.toggleable;
    }

    public onMenuItemSelected(event: Event, item: IExtendedMenuItem): void {
        if (item.menuItems?.length > 0 || item.disabled) {
            event.stopImmediatePropagation();
            event.stopPropagation();
            return;
        }
        this.contextMenuService.closeMenu(this.rootMenuId);
        if (this.isToggleable(item)) {
            item.toggled = !item.toggled;
            item.toggleEmitter?.emit(item.toggled);
            item.toggle?.(item);
        }
        item.select?.(item);
        item.selectEmitter?.emit(item);
    }

    public onMouseEnter(event: Event, item: IExtendedMenuItem) {
        item.focused = !item.disabled;
        this.menuHover.emit({
            menuItem: item,
            contextMenuRef: this.submenuRef ?? null
        });
        if (item.disabled) {
            return;
        }
        this.createSubmenu(event.target as Element, item);
    }

    public setActiveStyles(): void {
        if (!this.menuItem.disabled) {
            this.menuItem.focused = true;
        }
    }

    public setInactiveStyles(): void {
        this.menuItem.focused = false;
    }

}
