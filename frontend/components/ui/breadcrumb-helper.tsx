import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

interface BreadcrumbRoute {
  label: string;
  link?: string;
}

interface BreadcrumbHelperProps {
  routes: BreadcrumbRoute[];
}

export function BreadcrumbHelper({ routes }: BreadcrumbHelperProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {routes.map((route, index) => (
          <React.Fragment key={`route-${index}`}>
            <BreadcrumbItem
              key={`route-${index}`}
              className={index === 0 ? "hidden md:block" : ""}
            >
              {route.link ? (
                <BreadcrumbLink href={route.link}>{route.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{route.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < routes.length - 1 && (
              <BreadcrumbSeparator
                key={`separator-${index}`}
                className={index === 0 ? "hidden md:block" : ""}
              />
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
