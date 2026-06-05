"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { ChevronDownIcon, HorizontaLDots } from "@/icons/index";
import {
  NAV_CONFIG,
  ROLE_META,
  type NavItem,
  type NavSection,
  type UserRole,
} from "@/config/navConfig";

interface AppSidebarProps {
  role: UserRole;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ role }) => {

  
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const sections: NavSection[] = NAV_CONFIG[role];
  const roleMeta = ROLE_META[role] || ROLE_META["parent"]; // Fallback to 'user' role meta if not found

  const [openSubmenu, setOpenSubmenu] = useState<{
    sectionIdx: number;
    itemIdx: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => {
      // Special case: Jika sedang di report form, anggap menu students yang aktif
      if (pathname.startsWith('/teacher/report') && path === '/teacher/students') {
        return true;
      }
      
      // Jika path adalah root dashboard (/teacher), gunakan exact match
      if (path === '/teacher') {
        return pathname === '/teacher';
      }

      return pathname === path || pathname.startsWith(path + "/");
    },
    [pathname]
  );

  useEffect(() => {
    let matched = false;
    sections.forEach((section, sIdx) => {
      section.items.forEach((item, iIdx) => {
        if (item.subItems) {
          item.subItems.forEach((sub) => {
            if (isActive(sub.path)) {
              setOpenSubmenu({ sectionIdx: sIdx, itemIdx: iIdx });
              matched = true;
            }
          });
        }
      });
    });
    if (!matched) setOpenSubmenu(null);
  }, [pathname, isActive, sections]);

  // Update submenu height when it opens
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.sectionIdx}-${openSubmenu.itemIdx}`;
      const el = subMenuRefs.current[key];
      if (el) {
        setSubMenuHeight((prev) => ({ ...prev, [key]: el.scrollHeight }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (sectionIdx: number, itemIdx: number) => {
    setOpenSubmenu((prev) => {
      if (prev?.sectionIdx === sectionIdx && prev?.itemIdx === itemIdx) return null;
      return { sectionIdx, itemIdx };
    });
  };

  const showLabel = isExpanded || isHovered || isMobileOpen;

  // ── Render a single nav item ──────────────────────────────────────────────
  const renderItem = (item: NavItem, sIndex: number, iIndex: number) => {
    const submenuKey = `${sIndex}-${iIndex}`;
    const isOpen =
      openSubmenu?.sectionIdx === sIndex && openSubmenu?.itemIdx === iIndex;

    if (item.subItems) {
      // Has dropdown
      return (
        <li key={item.name}>
          <button
            onClick={() => handleSubmenuToggle(sIndex, iIndex)}
            className={`menu-item group cursor-pointer ${
              isOpen ? "menu-item-active" : "menu-item-inactive"
            } ${!showLabel ? "lg:justify-center" : "lg:justify-start"}`}
          >
            <span className={isOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
              {item.icon}
            </span>
            {showLabel && <span className="menu-item-text">{item.name}</span>}
            {showLabel && (
              <ChevronDownIcon
                className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-brand-500" : ""
                }`}
              />
            )}
          </button>

          {/* Dropdown sub-items */}
          {showLabel && (
            <div
              ref={(el) => { subMenuRefs.current[submenuKey] = el; }}
              className="overflow-hidden transition-all duration-300"
              style={{ height: isOpen ? `${subMenuHeight[submenuKey] ?? 0}px` : "0px" }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {item.subItems.map((sub) => (
                  <li key={sub.name}>
                    <Link
                      href={sub.path}
                      className={`menu-dropdown-item ${
                        isActive(sub.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {sub.name}
                      {sub.badge && (
                        <span
                          className={`ml-auto menu-dropdown-badge ${
                            isActive(sub.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                          }`}
                        >
                          {sub.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      );
    }

    // Simple link item
    return (
      <li key={item.name}>
        {item.path && (
          <Link
            href={item.path}
            className={`menu-item group ${
              isActive(item.path) ? "menu-item-active" : "menu-item-inactive"
            } ${!showLabel ? "lg:justify-center" : ""}`}
          >
            <span
              className={
                isActive(item.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
              }
            >
              {item.icon}
            </span>
            {showLabel && <span className="menu-item-text">{item.name}</span>}
          </Link>
        )}
      </li>
    );
  };

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen || isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div
        className={`py-6 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href={roleMeta.basePath}>
          {showLabel ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo_new.svg"
                alt="Logo"
                width={220}
                height={60}
                style={{ width: "auto", height: "auto" }}
                priority
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo_dark.svg"
                alt="Logo"
                width={220}
                height={60}
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </>
          ) : (
            <div className="flex items-center justify-center bg-brand-500/10 rounded-xl p-2">
              <Image
                src="/images/logo/icon.svg"
                alt="Logo"
                width={32}
                height={32}
                priority
              />
            </div>
          )}
        </Link>
      </div>

      {/* ── Role Badge ───────────────────────────────────────────────────── */}
      {showLabel && (
        <div className="mb-4 px-1">
          <span
            className={`text-xs font-semibold uppercase tracking-widest ${roleMeta.color}`}
          >
            {roleMeta.label}
          </span>
        </div>
      )}

      {/* ── Nav Sections ─────────────────────────────────────────────────── */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar gap-4">
        <nav>
          <div className="flex flex-col gap-6">
            {sections.map((section, sIdx) => (
              <div key={section.label}>
                {/* Section label */}
                <h2
                  className={`mb-3 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !showLabel ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {showLabel ? section.label : <HorizontaLDots />}
                </h2>

                {/* Items */}
                <ul className="flex flex-col gap-2">
                  {section.items.map((item, iIdx) =>
                    renderItem(item, sIdx, iIdx)
                  )}
                </ul>
              </div>
            ))}


          </div>
        </nav>
         {showLabel && (
        <div className="px-4 py-6 mt-auto">
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              E-Raport SPA
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Copyright©2026 AETHER CODE
            </p>
          </div>
        </div>
      )}
      </div>
    </aside>
  );
};

export default AppSidebar;